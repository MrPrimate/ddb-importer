// Main module class
import {
  logger,
  Secrets,
  FileHelper,
  FrameAnimator,
  FrameKeyframeRenderer,
  PatreonHelper,
  DDBProxy,
  utils,
} from "../lib/_module";
import { SETTINGS } from "../config/_module";
import { clearDDBFrameCache } from "../hooks/init/tokenizer2Frames";

interface IDDBFrameCatalogEntry {
  name: string;
  frameAvatarUrl: string;
  tags?: string[] | null;
  avatarFrameExtras?: IDDBAvatarFrameExtras | null;
}

// Reduce a DDB tag like "MToF Frames" / "2024 DMG Frames" / "TBoMT Frame" to a
// filesystem-safe folder name ("MToF", "2024_DMG", "TBoMT"). Non-alphanumeric
// non-space characters are stripped; runs of spaces collapse to a single "_".
// Returns "Misc" when the tag list is empty or sanitization leaves an empty
// string.
function _sourceFolderFromTags(tags: string[] | null | undefined): string {
  if (!Array.isArray(tags) || tags.length === 0) return "Misc";
  const tag = [...new Set(tags)][0];
  if (!tag) return "Misc";
  const trimmed = tag.replace(/\s+Frames?$/i, "").trim();
  const safe = trimmed
    .replace(/[^a-zA-Z0-9 ]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe || "Misc";
}

export default class DDBFrameImporter {

  static async getFrameData(): Promise<IDDBFrameCatalogEntry[]> {
    const cobaltCookie = Secrets.getCobalt();
    const betaKey = PatreonHelper.getPatreonKey();
    const parsingApi = DDBProxy.getProxy();
    const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

    const body = {
      cobalt: cobaltCookie,
      betaKey: betaKey,
    };

    const response = await fetch(`${parsingApi}/proxy/frames`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!data.success) {
      utils.munchNote(`API Failure: ${data.message}`);
      throw new Error(data.message);
    }
    if (debugJson) {
      FileHelper.download(JSON.stringify(data), `frames-raw.json`, "application/json");
    }
    if (Array.isArray(data.data) && data.data[0]) {
      logger.debug("DDBFrameImporter: sample frame keys", Object.keys(data.data[0]));
    }
    logger.info(`Retrieved ${data.data.length} frames`);
    return data.data;
  }

  static async _importFrame(frame: IDDBFrameCatalogEntry, baseDirectory: string, imageNamePrefix: string): Promise<void> {
    const filename = utils.referenceNameString(frame.name);
    const baseFilename = `${imageNamePrefix ? imageNamePrefix + "-" : ""}${filename}`;
    const extras = frame.avatarFrameExtras;
    // Bucket by source book (catalog tag) so the frames folder stays browsable
    const sourceFolder = _sourceFolderFromTags(frame.tags);
    const targetDirectory = `${baseDirectory}/${sourceFolder}`;
    // verifyPath is cached via CHECKED_DIRS so calling it once per frame is cheap
    try {
      await FileHelper.verifyPath(FileHelper.parseDirectory(targetDirectory));
    } catch (err) {
      logger.warn(`Could not verify frame subfolder ${targetDirectory}, falling back to base`, err);
    }

    // Skip the expensive WebM build+upload if the target file is already on
    // disk. The static fallback (FileHelper.getImagePath) self-skips at
    // FileHelper.ts:366-371, so we only need to guard the animated path here.
    const hasAnimated = FrameAnimator.isSpriteExtras(extras) || FrameKeyframeRenderer.isKeyframeExtras(extras);
    if (hasAnimated && await FileHelper.fileExists(targetDirectory, `${baseFilename}.webm`)) {
      logger.debug(`Skipping existing animated frame ${targetDirectory}/${baseFilename}.webm`);
      return;
    }

    let framePath: string | null = null;
    let blob: Blob | null = null;
    try {
      if (FrameAnimator.isSpriteExtras(extras)) {
        // Omit baseUrl: DDB hides the static frame PNG via CSS display:none
        // when sprite extras are present; the sprite IS the frame.
        blob = await FrameAnimator.buildWebM({
          baseUrl: null,
          spriteUrl: extras.animatedAvatarFrameUrl,
          reflectionUrl: extras.reflectionAvatarFrameUrl,
          frameWidth: extras.frameWidth,
          frameHeight: extras.frameHeight,
          frameCount: extras.frameCount,
          gridCols: extras.gridCols,
          gridRows: extras.gridRows,
          durationMs: extras.animationDurationMs,
          cssAnimationName: extras.cssAnimationName,
        });
      } else if (FrameKeyframeRenderer.isKeyframeExtras(extras)) {
        blob = await FrameKeyframeRenderer.buildWebM({
          baseFrameUrl: frame.frameAvatarUrl,
          extras,
        });
      }
    } catch (err) {
      logger.warn(`Animated frame build failed for ${frame.name}`, err);
    }
    if (blob) {
      framePath = await FileHelper.uploadBlob(blob, targetDirectory, baseFilename, "webm");
    }
    if (!framePath) {
      const options = { type: "frame", name: `DDB ${frame.name}`, download: true, targetDirectory, pathPostfix: "", imageNamePrefix };
      framePath = await FileHelper.getImagePath(frame.frameAvatarUrl, options);
    }
  }

  // Force the muncher's progress widget visible. notifierV2 normally does this
  // when called with a `progress` arg, but only when its `this.element` query
  // returns the right node  when the importer is called outside the muncher
  // context (or the v2 binding is shadowed) the widget stays hidden. Touching
  // the DOM directly via the same global IDs the v1 munchNote uses is a safe
  // belt-and-braces fallback.
  static _showProgressWidget(visible: boolean) {
    const el = document.querySelector(".ddb-muncher-details .munching-progress") as HTMLElement | null;
    if (!el) return;
    el.classList.toggle("munching-hidden", !visible);
  }

  static _setProgressBar(current: number, total: number) {
    const bar = document.querySelector(".ddb-muncher-details .munching-progress-bar") as HTMLElement | null;
    if (!bar) return;
    const pct = total > 0 ? Math.trunc((current / total) * 100) : 0;
    bar.style.width = `${pct}%`;
  }

  static async parseFrames(notifier?: (props: NotifierV2Props) => void): Promise<number> {
    // Call both the v2 notifier (for the structured progress channel) AND
    // utils.munchNote (the legacy global-id jQuery helper) so the user sees
    // the name/progress text regardless of any v2 wiring issue.
    const notifyV2 = notifier ?? (() => { /* noop */ });
    const notify = (message: string, progress?: { current: number; total: number }, clear = false) => {
      notifyV2({ section: "name", message, progress, clear });
      utils.munchNote(progress ? `${progress.current}/${progress.total} : ${message}` : message, { nameField: true });
    };

    notify("Fetching DDB frame catalog");
    const frames = await DDBFrameImporter.getFrameData();
    logger.debug("Importing frames", frames);
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "frame-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
    const imageNamePrefix = useDeepPaths ? "" : "frames";

    const total = frames.length;
    DDBFrameImporter._showProgressWidget(true);
    DDBFrameImporter._setProgressBar(0, total);
    notify(`Importing ${total} frames`, { current: 0, total });

    // Sequential to avoid hammering proxy and to keep MediaRecorder pipelines clean.
    // The await here means parseFrames does not resolve until every frame has either
    // succeeded or hit its catch  the caller's "finished" message is therefore safe.
    let processed = 0;
    for (const frame of frames) {
      processed += 1;
      notify(frame.name, { current: processed, total });
      DDBFrameImporter._setProgressBar(processed, total);
      try {
        await DDBFrameImporter._importFrame(frame, targetDirectory, imageNamePrefix);
      } catch (err) {
        logger.warn(`Frame import failed for ${frame.name}`, err);
      }
    }

    notify(`Imported ${total} frames`, { current: total, total });
    DDBFrameImporter._setProgressBar(total, total);
    // Leave the widget visible for ~5s on completion so the user sees the
    // final 100% bar, then hide it.
    setTimeout(() => DDBFrameImporter._showProgressWidget(false), 5000);

    // Bust tokenizer-2's loader cache so the Frame Browser re-scans on next open
    clearDDBFrameCache();

    return total;
  }

}
