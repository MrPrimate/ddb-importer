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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) { /* ignore unregistered */ }
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
  uploadedPath: string | null = null;
  metaPath: string | null = null;
  filename: string | null = null;

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
  }

  private _notify(msg: string) {
    if (this.options.notifier) this.options.notifier(msg);
  }

  private _resolveDirectory(): string {
    const base = uploadDirectory(this.options);
    const folder = setFolderName(this.sticker, this.options);
    return joinPath(base, folder);
  }

  async import(): Promise<IDDBStickerImportResult> {
    const imageKey = this.sticker.entitledData?.imageKey;
    if (!imageKey) {
      return { imagePath: null, metaPath: null, filename: null, skipped: true, reason: "missing-imageKey" };
    }

    this._notify(`Downloading sticker "${this.sticker.name}"...`);
    const blob = await DDBStickers.downloadImage({
      key: imageKey,
      cobalt: this.options.cobalt ?? null,
      campaignId: this.options.campaignId ?? null,
    });
    if (!blob) return { imagePath: null, metaPath: null, filename: null, skipped: true, reason: "download-failed" };

    const directory = this._resolveDirectory();
    await FileHelper.verifyPath(FileHelper.parseDirectory(directory));
    const filename = DDBStickers.filenameFromImageKey(imageKey);

    this._notify(`Uploading ${filename}...`);
    this.uploadedPath = await DDBSticker._runOnUploadChain(() =>
      FileHelper.uploadImage(blob, directory, filename),
    );
    this.filename = filename;

    // Update the per-folder _meta.json. Serialised per directory so two
    // parallel imports into the same set don't lose entries.
    this.metaPath = await chainMetaWrite(directory, async () => {
      const existing = await readMetaFile(directory);
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
      meta.stickers[filename] = {
        id: this.sticker.gameElementUri,
        name: this.sticker.name,
        altText: this.sticker.altText ?? null,
        keywords: this.sticker.keywords ?? [],
        imageKey,
        thumbnailKey: this.sticker.thumbnailKey ?? null,
        aspectRatio: this.sticker.entitledData?.aspectRatio ?? null,
        scale: this.sticker.entitledData?.scale ?? null,
        importedAt: Date.now(),
      };
      return writeMetaFile(directory, meta);
    });

    return {
      imagePath: this.uploadedPath,
      metaPath: this.metaPath,
      filename,
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
