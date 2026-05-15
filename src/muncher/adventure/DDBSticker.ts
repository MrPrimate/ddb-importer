import { logger, utils, FileHelper } from "../../lib/_module";
import DDBStickers from "../DDBStickers";

const DEFAULT_UPLOAD_PATH = "[data] ddb-images/stickers";
const META_FILENAME = "_meta.json";


// Serialise upload+meta-file writes per-folder so two parallel imports into
// the same set folder don't clobber each other's _meta.json updates. Each
// chain is keyed by full directory path.
const META_CHAINS = new Map<string, Promise<unknown>>();

function chainMetaWrite<T>(dir: string, fn: () => Promise<T>): Promise<T> {
  const prev = META_CHAINS.get(dir) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  META_CHAINS.set(dir, next.then(() => undefined, () => undefined));
  return next as Promise<T>;
}

function uploadDirectory(options: IDDBStickerImportOptions): string {
  const fromOptions = options.uploadPath?.trim();
  if (fromOptions) return fromOptions;
  try {
    const fromSetting = utils.getSetting<string>("stickers-upload-path");
    if (fromSetting && fromSetting.trim() !== "") return fromSetting;
  } catch (_e) { /* ignore unregistered */ }
  return DEFAULT_UPLOAD_PATH;
}

function setFolderName(sticker: IDDBSticker, options: IDDBStickerImportOptions): string {
  const sourceId = sticker.primarySourceId ?? -1;
  return DDBStickers.slugForSource(sourceId, options.setName);
}

function joinPath(base: string, folder: string): string {
  return base.endsWith("/") ? `${base}${folder}` : `${base}/${folder}`;
}

async function readMetaFile(directory: string): Promise<IDDBStickerSetMeta | null> {
  const fileUrl = await FileHelper.getFileUrl(directory, META_FILENAME);
  if (!fileUrl) return null;
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    logger.warn(`DDBSticker: could not read existing _meta.json at ${directory}: ${(error as Error).message}`);
    return null;
  }
}

async function writeMetaFile(directory: string, meta: IDDBStickerSetMeta): Promise<string | null> {
  const blob = new Blob([JSON.stringify(meta, null, 2)], { type: "application/json" });
  try {
    return await FileHelper.uploadImage(blob, directory, META_FILENAME);
  } catch (error) {
    logger.warn(`DDBSticker: failed to write _meta.json at ${directory}: ${(error as Error).message}`);
    return null;
  }
}

export default class DDBSticker {

  sticker: IDDBSticker;
  options: IDDBStickerImportOptions;
  imageKey: string | null;
  uploadedPath: string | null = null;
  metaPath: string | null = null;
  filename: string | null = null;
  directory: string | null = null;

  // Serialise FilePicker.uploadImage calls across all DDBSticker instances.
  private static _uploadChain: Promise<unknown> = Promise.resolve();

  private static _runOnUploadChain<T>(fn: () => Promise<T>): Promise<T> {
    const next = DDBSticker._uploadChain.then(fn, fn);
    DDBSticker._uploadChain = next.then(() => undefined, () => undefined);
    return next as Promise<T>;
  }

  constructor(sticker: IDDBSticker, options: IDDBStickerImportOptions = {}) {
    this.sticker = sticker;
    this.options = options;
    this.imageKey = sticker.entitledData?.imageKey ?? null;

    if (this.imageKey) {
      this.directory = this._resolveDirectory();
      const filename = DDBStickers.filenameFromImageKey(this.imageKey);
      this.filename = filename;
    } else {
      logger.warn(`DDBSticker: sticker "${sticker.name}" is missing an imageKey and cannot be imported`);
    }

  }

  private _notify(msg: string) {
    if (this.options.notifier) this.options.notifier(msg);
  }

  private _resolveDirectory(): string {
    const base = uploadDirectory(this.options);
    const folder = setFolderName(this.sticker, this.options);
    return joinPath(base, folder);
  }

  async existsLocally(): Promise<boolean> {
    return await FileHelper.fileExists(this.directory, this.filename).catch(() => false);
  }

  async getLocalUrl(): Promise<string | null> {
    if (!this.directory || !this.filename) return null;
    return await FileHelper.getFileUrl(this.directory, this.filename);
  }

  async import(): Promise<IDDBStickerImportResult> {
    if (!this.imageKey) {
      return { imagePath: null, metaPath: null, filename: null, skipped: true, reason: "missing-imageKey" };
    }

    // Fast-path: if the file already lives at the expected upload path, skip
    // the download + upload entirely and reuse the existing URL. Still falls
    // through to the meta-write below so _meta.json stays in sync (e.g. when
    // a sticker was uploaded manually or by a prior import that left no meta).
    const existsLocally = await this.existsLocally();
    if (existsLocally) {
      logger.info(`DDBSticker: file already exists at ${this.directory}/${this.filename}, skipping upload`);
      this._notify(`Sticker "${this.sticker.name}" already on disk; skipping download.`);
      this.uploadedPath = await this.getLocalUrl();
    } else {
      this._notify(`Downloading sticker "${this.sticker.name}"...`);
      const blob = await DDBStickers.downloadImage({
        key: this.imageKey,
        cobalt: this.options.cobalt ?? null,
        campaignId: this.options.campaignId ?? null,
      });
      if (!blob) return { imagePath: null, metaPath: null, filename: null, skipped: true, reason: "download-failed" };

      await FileHelper.verifyPath(FileHelper.parseDirectory(this.directory));

      this._notify(`Uploading ${this.filename}...`);
      this.uploadedPath = await DDBSticker._runOnUploadChain(() =>
        FileHelper.uploadImage(blob, this.directory, this.filename),
      );
      logger.debug(`DDBSticker: uploaded file to ${this.directory}/${this.filename}`);
      // Register the freshly uploaded file with FileHelper's in-memory cache
      // so a subsequent same-session fileExists() hits the fast-path. Without
      // this, generateCurrentFiles() would short-circuit (CHECKED_DIRS already
      // set by the pre-upload existence probe) and we'd re-download on every
      // repeat placement.
      if (this.uploadedPath) {
        try {
          FileHelper.addFileToKnown(FileHelper.parseDirectory(this.directory), this.uploadedPath);
        } catch (error) {
          logger.debug(`DDBSticker: addFileToKnown failed for ${this.uploadedPath}: ${(error as Error).message}`);
        }
      }
    }

    // Update the per-folder _meta.json. Serialised per directory so two
    // parallel imports into the same set don't lose entries.
    this.metaPath = await chainMetaWrite(this.directory, async () => {
      const existing = await readMetaFile(this.directory);
      const meta: IDDBStickerSetMeta = existing ?? {
        setId: this.sticker.primarySourceId ?? null,
        setName: this.options.setName ?? `source-${this.sticker.primarySourceId ?? "unknown"}`,
        fetchedAt: Date.now(),
        stickers: {},
      };
      // Refresh top-level set metadata in case the user passed a friendlier
      // setName this time round, and bump fetchedAt.
      meta.setId = this.sticker.primarySourceId ?? meta.setId;
      meta.setName = this.options.setName ?? meta.setName;
      meta.fetchedAt = Date.now();
      meta.stickers[this.filename] = {
        id: this.sticker.gameElementUri,
        name: this.sticker.name,
        altText: this.sticker.altText ?? null,
        keywords: this.sticker.keywords ?? [],
        imageKey: this.imageKey,
        thumbnailKey: this.sticker.thumbnailKey ?? null,
        aspectRatio: this.sticker.entitledData?.aspectRatio ?? null,
        scale: this.sticker.entitledData?.scale ?? null,
        importedAt: Date.now(),
      };
      return writeMetaFile(this.directory, meta);
    });

    return {
      imagePath: this.uploadedPath,
      metaPath: this.metaPath,
      filename: this.filename,
      skipped: false,
    };
  }

  static async importSticker(
    sticker: IDDBSticker,
    options: IDDBStickerImportOptions = {},
  ): Promise<IDDBStickerImportResult> {
    return new DDBSticker(sticker, options).import();
  }

  // Run a batch with bounded concurrency. Downloads and meta-writes pipeline;
  // FilePicker uploads serialise via the shared upload chain.
  static async importBatch(
    items: { sticker: IDDBSticker; options?: IDDBStickerImportOptions }[],
    onProgress?: (info: { index: number; total: number; sticker: IDDBSticker; result: IDDBStickerImportResult | null; error?: Error }) => void,
    concurrency = 4,
  ): Promise<IDDBStickerImportResult[]> {
    const total = items.length;
    const results: IDDBStickerImportResult[] = new Array(total);
    let nextIdx = 0;
    let completed = 0;

    const worker = async () => {
      while (true) {
        const idx = nextIdx++;
        if (idx >= total) return;
        const { sticker, options } = items[idx];
        try {
          const res = await DDBSticker.importSticker(sticker, options ?? {});
          results[idx] = res;
          completed += 1;
          onProgress?.({ index: completed, total, sticker, result: res });
        } catch (error) {
          const err = error as Error;
          results[idx] = { imagePath: null, metaPath: null, filename: null, skipped: true, reason: err.message };
          completed += 1;
          onProgress?.({ index: completed, total, sticker, result: null, error: err });
        }
      }
    };

    const workerCount = Math.max(1, Math.min(concurrency, total));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
  }

}
