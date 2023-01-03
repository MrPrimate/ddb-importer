import { DirectoryPicker } from "../lib/DirectoryPicker.js";
import logger from "../logger.js";
import SETTINGS from "../settings.js";
import DDBProxy from "./DDBProxy.js";
import utils from "./utils.js";

const FileHelper = {
  BAD_DIRS: ["[data]", "[data] ", "", null],

  removeFileExtension: (name) => {
    let nameArray = name.split(".");
    nameArray.pop();
    return nameArray.join(".");
  },


  /**
   * Read data from a user provided File object
   * @param {File} file           A File object
   * @return {Promise.<String>}   A Promise which resolves to the loaded text data
   */
  readBlobFromFile: (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reader.abort();
        reject();
      };
      reader.readAsBinaryString(file);
    });
  },

  download: (content, fileName, contentType) => {
    let a = document.createElement("a");
    let file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  },

  fileExistsUpdate: (fileList) => {
    const targetFiles = fileList.filter((f) => !CONFIG.DDBI.KNOWN.FILES.has(f));
    for (const file of targetFiles) {
      CONFIG.DDBI.KNOWN.FILES.add(file);
    }
  },

  generateCurrentFiles: async (directoryPath) => {
    if (!CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(directoryPath)) {
      logger.debug(`Checking for files in ${directoryPath}...`);
      const dir = DirectoryPicker.parse(directoryPath);
      const fileList = await DirectoryPicker.browse(dir.activeSource, dir.current, {
        bucket: dir.bucket,
      });
      FileHelper.fileExistsUpdate(fileList.files);
      // lets do some forge fun because
      if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
        if (fileList.bazaar) {
          // eslint-disable-next-line require-atomic-updates
          CONFIG.DDBI.KNOWN.FORGE.TARGETS[directoryPath] = {};
          fileList.files.forEach((file) => {
            const fileName = file.split("/").pop();
            CONFIG.DDBI.KNOWN.FORGE.TARGETS[directoryPath][fileName] = file;
            CONFIG.DDBI.KNOWN.FILES.add(file);
          });
        } else {
          const status = ForgeAPI.lastStatus || (await ForgeAPI.status());
          const userId = status.user;
          // eslint-disable-next-line require-atomic-updates
          CONFIG.DDBI.KNOWN.FORGE.TARGET_URL_PREFIX[directoryPath] = `https://assets.forge-vtt.com/${userId}/${dir.current}`;
        }
      }

      CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(directoryPath);
    } else {
      logger.debug(`Skipping full dir scan for ${directoryPath}...`);
    }
  },

  fileExists: async (directoryPath, filename) => {
    const fileUrl = await FileHelper.getFileUrl(directoryPath, filename);
    let existingFile = CONFIG.DDBI.KNOWN.FILES.has(fileUrl);
    if (existingFile) return true;

    logger.debug(`Checking for ${filename} at ${fileUrl}...`);
    await FileHelper.generateCurrentFiles(directoryPath);

    const filePresent = CONFIG.DDBI.KNOWN.FILES.has(fileUrl);

    if (filePresent) {
      logger.debug(`Found ${fileUrl} after directory scan.`);
    } else {
      logger.debug(`Could not find ${fileUrl}`, {
        directoryPath,
        filename,
        fileUrl,
      });
    }

    return filePresent;
  },

  convertImageToWebp: async function (file, filename) {
    logger.info(`Converting file ${filename} to webp`);

    // Load the data into an image
    const result = new Promise((resolve) => {
      let rawImage = new Image();

      rawImage.addEventListener("load", () => {
        resolve(rawImage);
      });

      rawImage.src = URL.createObjectURL(file);
    })
      .then((rawImage) => {
        // Convert image to webp ObjectURL via a canvas blob
        return new Promise((resolve) => {
          let canvas = document.createElement("canvas");
          let ctx = canvas.getContext("2d");
          const quality = game.settings.get(SETTINGS.MODULE_ID, "webp-quality");

          canvas.width = rawImage.width;
          canvas.height = rawImage.height;
          ctx.drawImage(rawImage, 0, 0);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, "image/webp", quality);
        });
      }).then((blob) => {
        return blob;
      });

    return result;
  },

  uploadFile: async function (data, path, filename, forceWebp = false) {
    const useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp");
    const file = new File([data], filename, { type: data.type });
    const imageType = data.type.startsWith("image") && data.type !== "image/webp";
    const uploadFile = useWebP && (imageType || forceWebp)
      ? new File([await FileHelper.convertImageToWebp(file, filename)], filename, { type: "image/webp" })
      : file;

    const result = await DirectoryPicker.uploadToPath(path, uploadFile);
    return result;
  },

  uploadImage: async function (data, path, filename, forceWebp = false) {
    return new Promise((resolve, reject) => {
      FileHelper.uploadFile(data, path, filename, forceWebp)
        .then((result) => {
          resolve(result.path);
        })
        .catch((error) => {
          logger.error("error uploading file: ", error);
          reject(error);
        });
    });
  },

  downloadImage: async function (url) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "GET",
        headers: {
          "x-requested-with": "foundry"
        },
      })
        .then((response) => {
          if (!response.ok) {
            reject("Could not retrieve image");
          }
          return response.blob();
        })
        .then((blob) => resolve(blob))
        .catch((error) => reject(error.message));
    });
  },

  uploadRemoteImage: async function (url, targetDirectory, baseFilename, useProxy = true) {
    // prepare filenames
    const filename = baseFilename;
    const useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp");
    const ext = useWebP
      ? "webp"
      : url
        .split(".")
        .pop()
        .split(/#|\?|&/)[0];

    try {
      const proxyEndpoint = DDBProxy.getCORSProxy();
      const urlEncode = game.settings.get(SETTINGS.MODULE_ID, "cors-encode");
      const target = urlEncode ? encodeURIComponent(url) : url;
      url = useProxy ? proxyEndpoint + target : url;
      const data = await FileHelper.downloadImage(url);
      // hack as proxy returns ddb access denied as application/xml
      if (data.type === "application/xml") return null;
      const result = await FileHelper.uploadImage(data, targetDirectory, filename + "." + ext);
      CONFIG.DDBI.KNOWN.FILES.add(result);
      return result;
    } catch (error) {
      logger.error("Image upload error", error);
      ui.notifications.warn(`Image upload failed. Please check your ddb-importer upload folder setting. ${url}`);
      return null;
    }
  },

  getForgeUrl: async (directoryPath, filename) => {
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
      const dir = DirectoryPicker.parse(directoryPath);
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
  },

  getFileUrl: async (directoryPath, filename) => {
    let uri;
    try {
      if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
        uri = await FileHelper.getForgeUrl(directoryPath, filename);
        return uri;
      } else {
        const dir = DirectoryPicker.parse(directoryPath);
        if (dir.activeSource == "data") {
          // Local on-server file system
          uri = dir.current + "/" + filename;
        } else if (dir.activeSource == "forgevtt") {
          const status = ForgeAPI.lastStatus || (await ForgeAPI.status());
          const userId = status.user;
          uri = `https://assets.forge-vtt.com/${userId}/${dir.current}/${filename}`;
        } else if (dir.activeSource == "s3") {
          // S3 Bucket
          uri = `https://${dir.bucket}.${game.data.files.s3.endpoint.hostname}/${dir.current}/${filename}`;
        } else {
          logger.error("DDB Importer cannot handle files stored in that location", dir);
        }
      }
    } catch (exception) {
      throw new Error(
        'Unable to determine file URL for directoryPath"' + directoryPath + '" and filename"' + filename + '"'
      );
    }
    return encodeURI(uri);
  },

  // const options = { type: "frame", name: `DDB ${frame.name}`, download: true, remoteImages: false, force: false };
  getImagePath: async (imageUrl, { type = "ddb", name = "", download = false, remoteImages = false, force = false } = {}) => {
    const frameDirectory = game.settings.get(SETTINGS.MODULE_ID, "frame-image-upload-directory").replace(/^\/|\/$/g, "");
    const otherDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const uploadDirectory = type === "frame" ? frameDirectory : otherDirectory;
    const downloadImage = (download) ? download : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-download-images");
    const remoteImage = (remoteImages) ? remoteImages : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-remote-images");
    const useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp");

    if (imageUrl && downloadImage) {
      const ext = useWebP
        ? "webp"
        : imageUrl.split(".").pop().split(/#|\?|&/)[0];
      if (!name) name = imageUrl.split("/").pop();

      // image upload
      const filename = type + "-" + utils.referenceNameString(name);
      const imageExists = await FileHelper.fileExists(uploadDirectory, filename + "." + ext);

      if (imageExists && !force) {
        // eslint-disable-next-line require-atomic-updates
        const image = await FileHelper.getFileUrl(uploadDirectory, filename + "." + ext);
        return image.trim();
      } else {
        // eslint-disable-next-line require-atomic-updates
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
      } catch (ignored) {
        return null;
      }
    }
    return null;
  },

};

export default FileHelper;
