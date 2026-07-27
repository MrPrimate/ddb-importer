import logger from "./Logger";
import utils from "./Utils";
import DDBProxy from "./DDBProxy";

const FPClass = foundry.applications.apps.FilePicker.implementation;

interface ParsedDirectory {
  activeSource: string;
  bucket: string | null;
  current: string;
  fullPath: string;
}

export class FileHelper {

  static BAD_DIRS = ["[data]", "[data] ", "", null];

  static removeFileExtension(name: string): string {
    const nameArray = name.split(".");
    nameArray.pop();
    return nameArray.join(".");
  }

  // Derive a file extension from an image mime type, e.g. "image/jpeg" -> "jpg".
  // Returns "" when the mime type is missing/unrecognised so callers can fall back.
  static getExtensionFromMime(mime: string): string {
    const subtype = (mime ?? "").split("/")[1]?.split("+")[0]?.toLowerCase() ?? "";
    const overrides: Record<string, string> = {
      jpeg: "jpg",
    };
    return overrides[subtype] ?? subtype;
  }

  static download(content: any, fileName: string, contentType: string) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  static addFileToKnown(parsedDir: ParsedDirectory, file: string) {
    if (!file) return;
    CONFIG.DDBI.KNOWN.FILES.add(file);
    const split = file.split(parsedDir.current);
    if (split.length > 1) {
      const fileName = split[1].startsWith("/") ? split[1] : `/${split[1]}`;
      CONFIG.DDBI.KNOWN.FILES.add(`${parsedDir.fullPath}${fileName}`);
      CONFIG.DDBI.KNOWN.LOOKUPS.set(`${parsedDir.fullPath}${fileName}`, file);
    }
  }

  static fileExistsUpdate(parsedDir: ParsedDirectory, fileList: string[]) {
    const targetFiles = fileList.filter((f: string) => !CONFIG.DDBI.KNOWN.FILES.has(f));
    for (const file of targetFiles) {
      FileHelper.addFileToKnown(parsedDir, file);
    }
  }

  static dirExistsUpdate(dirList: string[]) {
    const targetFiles = dirList.filter((f: string) => !CONFIG.DDBI.KNOWN.DIRS.has(f));
    for (const file of targetFiles) {
      CONFIG.DDBI.KNOWN.DIRS.add(file);
    }
  }

  static async doesDirExist(directoryPath: string) {
    const dir = FileHelper.parseDirectory(directoryPath);
    try {
      await FPClass.browse(dir.activeSource, dir.current, {
        bucket: dir.bucket ?? undefined,
      });
      return true;
    } catch (_error) {
      return false;
    }
  }

  static async generateCurrentFilesFromParsedDir(parsedDir: ParsedDirectory, verbose = true) {
    if (CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(parsedDir.fullPath)) {
      logger.debug(`Skipping full dir scan for ${parsedDir.fullPath}...`);
      return;
    }
    logger.verbose(`Checking for files in ${parsedDir.fullPath}...`, parsedDir);

    try {
      const fileList = await FPClass.browse(parsedDir.activeSource, parsedDir.current, {
        bucket: parsedDir.bucket,
        // recursive is real but not in the types
        recursive: true,
      } as unknown as Parameters<typeof FPClass.browse>[2]);
      FileHelper.fileExistsUpdate(parsedDir, fileList.files);
      FileHelper.dirExistsUpdate(fileList.dirs);
      // lets do some forge fun because
      if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
        if (foundry.utils.getProperty(fileList, "bazaar")) {
          CONFIG.DDBI.KNOWN.FORGE.TARGETS[parsedDir.fullPath] = {};
          fileList.files.forEach((file) => {
            const fileName = file.split("/").pop() ?? "";
            CONFIG.DDBI.KNOWN.FORGE.TARGETS[parsedDir.fullPath][fileName] = file;
            FileHelper.addFileToKnown(parsedDir, file);
          });
        } else {
          const assetPrefix = ForgeVTT.ASSETS_LIBRARY_URL_PREFIX + await ForgeAPI.getUserId();
          CONFIG.DDBI.KNOWN.FORGE.TARGET_URL_PREFIX[parsedDir.fullPath] = `${assetPrefix}/${parsedDir.current}`;
        }
      }

      CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(parsedDir.fullPath);
    } catch (error) {
      if (verbose) logger.error(`Error checking for files in ${parsedDir.fullPath}`, error);
      else logger.verbose(`Can't find in ${parsedDir.fullPath}`);
    }

  }

  static async generateCurrentFiles(directoryPath: string): Promise<void> {
    if (!CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(directoryPath)) {
      logger.verbose(`Checking for files in directoryPath ${directoryPath}...`);
      const dir = FileHelper.parseDirectory(directoryPath);
      await FileHelper.verifyPath(dir);
      await FileHelper.generateCurrentFilesFromParsedDir(dir);
    } else {
      logger.debug(`Skipping full dir scan for ${directoryPath}...`);
    }
  }

  static async fileExists(directoryPath: string, filename: string): Promise<boolean> {
    const fileRef = `${directoryPath}/${filename}`;
    const existingFile = CONFIG.DDBI.KNOWN.FILES.has(fileRef);
    if (existingFile) return true;

    logger.debug(`Checking for ${filename} at ${fileRef}...`);
    await FileHelper.generateCurrentFiles(directoryPath);

    const filePresent = CONFIG.DDBI.KNOWN.FILES.has(fileRef);

    if (filePresent) {
      logger.debug(`Found ${fileRef} after directory scan.`);
    } else {
      logger.debug(`Could not find ${fileRef}`, {
        directoryPath,
        filename,
        fileUrl: fileRef,
      });
    }

    return filePresent;
  }

  static async convertImageToWebp(file: File | Blob, filename: string): Promise<BlobPart> {
    logger.info(`Converting file ${filename} to webp`);

    const timeoutSeconds = utils.getSetting<number>("webp-timeout") || 30;
    const timeoutMs = timeoutSeconds * 1000;

    return new Promise<Blob>((resolve, reject) => {
      const rawImage = new Image();
      const objectUrl = URL.createObjectURL(file);

      let timer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timer !== null) clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);
      };

      const fail = (message: string, cause?: unknown) => {
        cleanup();
        logger.warn(message, cause);
        reject(new Error(message, cause === undefined ? undefined : { cause }));
      };

      timer = setTimeout(() => {
        fail(`WebP conversion timed out after ${timeoutSeconds}s for ${filename}`);
      }, timeoutMs);

      rawImage.addEventListener("error", (event) => {
        fail(`WebP conversion failed to load image ${filename}`, event);
      });

      rawImage.addEventListener("load", () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            fail(`WebP conversion could not create a canvas context for ${filename}`);
            return;
          }
          const quality = utils.getSetting<number>("webp-quality");

          canvas.width = rawImage.width;
          canvas.height = rawImage.height;
          ctx.drawImage(rawImage, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              fail(`WebP conversion produced no blob for ${filename}`);
              return;
            }
            cleanup();
            resolve(blob);
          }, "image/webp", quality);
        } catch (error) {
          fail(`WebP conversion failed while drawing ${filename}`, error);
        }
      });

      rawImage.src = objectUrl;
    });
  }

  static async uploadFile(data: File | Blob, path: string, filename: string, forceWebp = false): Promise<FilePicker.UploadReturn> {
    const useWebP = utils.getSetting<boolean>("use-webp");
    const file = new File([data], filename, { type: data.type });
    const imageType = data.type.startsWith("image") && data.type !== "image/webp";
    let uploadFile = file;
    if (useWebP && (imageType || forceWebp)) {
      try {
        uploadFile = new File([await FileHelper.convertImageToWebp(file, filename)], filename, { type: "image/webp" });
      } catch (error) {
        // Conversion failed (corrupt/oversized/unsupported/timeout). Fall back to the
        // original image so it isn't dropped, fixing the extension to match the
        // original format (the filename was given a `.webp` extension by the caller).
        const fallbackExt = FileHelper.getExtensionFromMime(data.type);
        const fallbackFilename = fallbackExt
          ? `${FileHelper.removeFileExtension(filename)}.${fallbackExt}`
          : filename;
        logger.warn(`WebP conversion failed for ${filename}, uploading original image as ${fallbackFilename}`, error);
        uploadFile = new File([data], fallbackFilename, { type: data.type });
      }
    }

    const result = await FileHelper.uploadToPath(path, uploadFile);
    return result;
  }

  // FilePicker.upload returns false (server error), void (empty path or HttpError),
  // or an empty object (other throw) instead of rejecting; only a SuccessResponse has a path.
  static isUploadSuccess(result: FilePicker.UploadReturn): result is FilePicker.SuccessResponse {
    return typeof result === "object" && result !== null && "path" in result && typeof result.path === "string";
  }

  static async uploadImage(data: File | Blob, path: string, filename: string, forceWebp = false): Promise<string> {
    try {
      const result = await FileHelper.uploadFile(data, path, filename, forceWebp);
      if (!FileHelper.isUploadSuccess(result)) {
        throw new Error(`Upload of "${filename}" to "${path}" failed, no path returned`);
      }
      return result.path;
    } catch (error) {
      logger.error("error uploading file: ", error);
      throw error;
    }
  }

  static async downloadImage(url: string, attempt = 1): Promise<Blob> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-requested-with": "foundry",
        },
      });
      if (!response.ok) throw new Error("Could not retrieve image");
      return response.blob();
    } catch (error) {
      if (attempt >= 5) throw error;
      const delay = 1000 * Math.pow(2, attempt - 1);
      logger.warn(`Image download attempt ${attempt} failed, retrying in ${delay}ms: ${url}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return FileHelper.downloadImage(url, attempt + 1);
    }
  }

  static async uploadBlob(blob: Blob, targetDirectory: string, baseFilename: string, extension: string): Promise<string | null> {
    try {
      const filename = `${baseFilename}.${extension}`;
      const file = new File([blob], filename, { type: blob.type });
      const result = await FileHelper.uploadToPath(targetDirectory, file);
      const path = foundry.utils.getProperty(result as object, "path") as string | undefined;
      if (path) {
        FileHelper.addFileToKnown(FileHelper.parseDirectory(targetDirectory), path);
        CONFIG.DDBI.KNOWN.LOOKUPS.set(`${targetDirectory}/${baseFilename}`, path);
      }
      return path ?? null;
    } catch (error) {
      logger.error("Blob upload error", error);
      return null;
    }
  }

  static async uploadRemoteImage(originalUrl: string, targetDirectory: string, baseFilename: string, useProxy = true): Promise<string | null> {
    // prepare filenames
    const filename = baseFilename;
    const useWebP = utils.getSetting<boolean>("use-webp");
    const ext = useWebP
      ? "webp"
      : (originalUrl
        .split(".")
        .pop() ?? "")
        .split(/#|\?|&/)[0];
    const urlEncode = utils.getSetting<boolean>("cors-encode");
    const stripProtocol = utils.getSetting<boolean>("cors-strip-protocol");
    const corsPathPrefix = utils.getSetting<string>("cors-path-prefix");
    let url = originalUrl.split("?")[0];

    try {
      const proxyEndpoint = DDBProxy.getCORSProxy();
      const fiddledUrl = stripProtocol ? url.replace(/^https:\/\//, corsPathPrefix) : `${corsPathPrefix}${url}`;
      const target = urlEncode ? encodeURIComponent(fiddledUrl) : fiddledUrl;
      url = useProxy ? proxyEndpoint + target : url;
      const data = await FileHelper.downloadImage(url);
      // hack as proxy returns ddb access denied as application/xml
      if (data.type === "application/xml") return null;
      const result = await FileHelper.uploadImage(data, targetDirectory, filename + "." + ext);
      FileHelper.addFileToKnown(FileHelper.parseDirectory(targetDirectory), result);
      CONFIG.DDBI.KNOWN.LOOKUPS.set(`${targetDirectory}/${baseFilename}`, result);
      return result;
    } catch (error) {
      logger.error("Image upload error", error);
      ui.notifications.warn(`Image upload failed. Please check your ddb-importer upload folder setting. ${originalUrl}`);
      return null;
    }
  }

  static async getForgeUrl(directoryPath: string, filename: string): Promise<string> {
    let uri;
    if (!CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(directoryPath)) {
      await FileHelper.generateCurrentFiles(directoryPath);
    }
    const prefix = CONFIG.DDBI.KNOWN.FORGE.TARGET_URL_PREFIX[directoryPath];
    const bazaarTargetPath = CONFIG.DDBI.KNOWN.FORGE.TARGETS[directoryPath];
    const bazaarTarget = bazaarTargetPath ? bazaarTargetPath[filename] : undefined;
    if (bazaarTarget) {
      uri = bazaarTarget;
    } else if (prefix) {
      uri = `${prefix}/${filename}`;
    } else {
      // we can't find the directory path for some reason, final fallback, try and guess the url
      const dir = FileHelper.parseDirectory(directoryPath);
      if (dir.activeSource == "data") {
        // Local on-server file system
        uri = `https://assets.forge-vtt.com/bazaar/${dir.current}/${filename}`;
      } else if (dir.activeSource == "forgevtt") {
        const status = ForgeAPI.lastStatus || (await ForgeAPI.status());
        const userId = status.user;
        uri = `https://assets.forge-vtt.com/${userId}/${dir.current}/${filename}`;
      }
    }
    return uri;
  }

  static async getFileUrl(directoryPath: string, filename: string): Promise<string> {
    let uri;
    try {
      if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
        uri = await FileHelper.getForgeUrl(directoryPath, filename);
        return uri;
      } else {
        const dir = FileHelper.parseDirectory(directoryPath);
        if (dir.activeSource == "data") {
          // Local on-server file system
          uri = dir.current + "/" + filename;
        } else if (dir.activeSource == "forgevtt") {
          const status = ForgeAPI.lastStatus || (await ForgeAPI.status());
          const userId = status.user;
          uri = `https://assets.forge-vtt.com/${userId}/${dir.current}/${filename}`;
        } else if (dir.activeSource == "s3") {
          // S3 Bucket
          const s3 = game.data.files.s3;
          if (!s3) throw new Error("S3 file storage is not configured on this server");
          uri = `https://${dir.bucket}.${s3.endpoint.hostname}/${dir.current}/${filename}`;
        } else {
          logger.error("DDB Importer cannot handle files stored in that location", dir);
          throw new Error(`DDB Importer cannot handle files stored in source "${dir.activeSource}"`);
        }
      }
    } catch (exception) {
      throw new Error(`Unable to determine file URL for directoryPath "${directoryPath}" and filename "${filename}"`, {
        cause: exception,
      });
    }
    return encodeURI(uri);
  }

  static async getImagePath(imageUrl: string, { type = "ddb", imageNamePrefix = "", name = undefined as string | undefined, download = false,
    remoteImages = false, force = false, pathPostfix = "", targetDirectory = undefined as string | undefined } = {},
  ) {
    if (!name || !targetDirectory) {
      logger.error(`You must supply a targetDirectory and name for the image ${imageUrl}`, { name, targetDirectory, type });
      throw new Error(`You must supply a targetDirectory and name for the image ${imageUrl}`);
    }
    logger.verbose(`Getting image path for ${imageUrl}`, {
      type,
      imageNamePrefix,
      name,
      download,
      remoteImages,
      force,
      pathPostfix,
      targetDirectory,
    });
    const uploadDirectory = `${targetDirectory}${pathPostfix}`;
    if (!CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(uploadDirectory)) {
      const parsedPath = FileHelper.parseDirectory(uploadDirectory);
      await FileHelper.verifyPath(parsedPath);
      await FileHelper.generateCurrentFilesFromParsedDir(parsedPath);
    }
    const downloadImage = (download) ? download : utils.getSetting<boolean>("munching-policy-download-images");
    const remoteImage = (remoteImages) ? remoteImages : utils.getSetting<boolean>("munching-policy-remote-images");
    const useWebP = utils.getSetting<boolean>("use-webp");

    if (imageUrl && downloadImage) {
      const ext = useWebP
        ? "webp"
        : (imageUrl.split(".").pop() ?? "").split(/#|\?|&/)[0];
      if (!name) name = imageUrl.split("/").pop() ?? "";

      // image upload
      const fileNamePrefix = !imageNamePrefix || imageNamePrefix.trim() === "" ? "" : `${imageNamePrefix}-`;
      const filename = `${fileNamePrefix}${utils.referenceNameString(name)}`;
      const imageExists = await FileHelper.fileExists(uploadDirectory, filename + "." + ext);

      if (imageExists && !force) {
        // const image = await FileHelper.getFileUrl(uploadDirectory, filename + "." + ext);
        const image = CONFIG.DDBI.KNOWN.LOOKUPS.get(`${uploadDirectory}/${filename}.${ext}`);
        return image.trim();
      } else {
        const image = await FileHelper.uploadRemoteImage(imageUrl, uploadDirectory, filename);
        // did upload succeed? if not fall back to remote image path
        if (image) {
          return image.trim();
        } else {
          return null;
        }

      }
    } else if (imageUrl && remoteImage) {
      try {
        return imageUrl.trim();
      } catch (_ignored) {
        return null;
      }
    }
    return null;
  }

  static async forgeCreateDirectory(target: string) {
    if (!target) return undefined;
    const response = await ForgeAPI.call("assets/new-folder", { path: target });
    if (!response || response.error) {
      throw new Error(response ? response.error : "Unknown error while creating directory.");
    }
    return response;
  }

  /**
   * Create a directory on the file system. If running on ForgeVTT, will use the Forge's API
   * to create a new folder. Otherwise falls back to `FilePicker.createDirectory`.
   * @param {string} source
   * @param {string} target directory name
   * @param {object} options options passed to FilePicker.createDirectory
   * @returns {Promise<string|undefined>} path to the created directory, or undefined if
   * failure
   */
  static async createDirectory(source: string, target: string, options = {}) {
    if (!target) {
      throw new Error("No directory name provided");
    }
    if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
      return FileHelper.forgeCreateDirectory(target);
    }
    return FPClass.createDirectory(source, target, options);
  }

  /**
   * Verifies server path exists, and if it doesn't creates it.
   *
   * @param  {ParsedDirectory} parsedPath output from FilePicker, parsed
   * @param  {string} targetPath if set will check this path, else check parsedPath.current
   * @returns {boolean} true if verified, false if unable to create/verify
   */
  static async verifyPath(parsedPath: ParsedDirectory, targetPath: string | null = null) {
    try {
      if (CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(parsedPath.fullPath)) return true;
      const paths = (targetPath) ? targetPath.split("/") : parsedPath.current.split("/");
      let currentSource = paths[0];

      for (let i = 0; i < paths.length; i += 1) {
        try {
          if (currentSource !== paths[i]) {
            currentSource = `${currentSource}/${paths[i]}`;
          }

          const tempParsed = foundry.utils.deepClone(parsedPath);
          tempParsed.fullPath = currentSource;
          const possiblePath = FileHelper.formatDirectoryPath(tempParsed);
          const newPathed = FileHelper.parseDirectory(possiblePath);

          // first lets try a quick check
          await FileHelper.generateCurrentFilesFromParsedDir(newPathed, false);
          // still missing, create
          if (!CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(newPathed.fullPath)) {
            await FileHelper.createDirectory(parsedPath.activeSource, `${currentSource}`, { bucket: parsedPath.bucket });
          }
        } catch (err) {
          const errMessage = String(utils.errorMessage(err)).replace(/^Error: /, "").trim();
          if (!errMessage.startsWith("EEXIST") && !errMessage.startsWith("The S3 key")) {
            logger.error(`Error trying to verify path [${parsedPath.activeSource}], ${parsedPath.current}`, err);
            logger.error("parsedPath", parsedPath);
            logger.error("targetPath", targetPath);
          }
        }
      }
    } catch (err) {
      logger.error("Unable to verify path", err);
      return false;
    }

    return true;
  }

  static async verifyDirectory(parsedPath: ParsedDirectory, targetPath = null as string | null) {
    if (CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(parsedPath.fullPath)) return true;
    return FileHelper.verifyPath(parsedPath, targetPath);
  }

  static async uploadToPath(path: string, file: File): Promise<FilePicker.UploadReturn> {
    const options = FileHelper.parseDirectory(path);
    return FPClass.upload(options.activeSource, options.current, file, { bucket: options.bucket }, { notify: false });
  }

  static parseDirectory(str: string): ParsedDirectory {
    // parses the string back to something the FilePicker can understand as an option
    const matches = str.match(/\[(.+)\]\s*(.+)/);
    if (matches) {
      const source = matches[1];
      const current = matches[2].trim();
      const [s3, bucket] = source.split(":");
      if (bucket !== undefined) {
        return {
          activeSource: s3,
          bucket: bucket,
          current: current,
          fullPath: str,
        };
      } else {
        return {
          activeSource: s3,
          bucket: null,
          current: current,
          fullPath: str,
        };
      }
    }
    // failsave, try it at least
    return {
      activeSource: "data",
      bucket: null,
      current: str,
      fullPath: str,
    };
  }

  static formatDirectoryPath(data: ParsedDirectory): string {
    return data.bucket !== null && data.bucket !== ""
      ? `[${data.activeSource}:${data.bucket}] ${data.current ?? ""}`
      : `[${data.activeSource}] ${data.current ?? ""}`;
  }

};

export default FileHelper;
