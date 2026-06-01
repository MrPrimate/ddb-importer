// Registers a DDB Importer frame loader with tokenizer-2 so its Frame Browser
// can show every PNG/WebP/WebM the importer has dropped into the configured
// frame-image-upload-directory. The loader is async and is invoked once per
// browser open (its result is cached by tokenizer-2 until clearCache fires).
//
// After any import that may have added frames to that directory, call
// `clearDDBFrameCache()` to force a fresh scan on the next browser open.

import { SETTINGS } from "../../config/_module";
import { FileHelper, logger, utils } from "../../lib/_module";

const LOADER_ID = "ddb-importer";

const IMAGE_RE = /\.(png|jpe?g|webp|gif|svg|avif|bmp|webm|mp4|m4v|mov|ogv)$/i;

const FPClass = foundry.applications.apps.FilePicker.implementation;

interface ScanResult {
  files: string[];
  subdirs: Record<string, ScanResult>;
}

async function _scanDirectory(activeSource: string, current: string, bucket: string | null): Promise<ScanResult> {
  const opts: any = {};
  if (bucket) opts.bucket = bucket;
  const result = await FPClass.browse(activeSource, current, opts);
  const files = (result.files ?? []).filter((f: string) => IMAGE_RE.test(f));
  const subdirs: Record<string, ScanResult> = {};
  for (const sub of result.dirs ?? []) {
    const subName = sub.split("/").pop()!;
    try {
      subdirs[subName] = await _scanDirectory(activeSource, sub, bucket);
    } catch (err) {
      logger.debug(`DDB tokenizer-2 loader: skipping subdir ${sub}`, err);
    }
  }
  return { files, subdirs };
}

function _toFrames(files: string[]) {
  return files.map((src) => ({
    src,
    label: src.split("/").pop()!.replace(/\.\w+$/, "").replace(/[-_]/g, " "),
  }));
}

// Flatten the scan into one subsection per non-empty folder so the picker
// groups frames the way the user organised them on disk. The top-level folder
// is the unlabeled root section.
function _toSubsections(root: ScanResult): { label: string | null; frames: { src: string; label: string }[] }[] {
  const out: { label: string | null; frames: { src: string; label: string }[] }[] = [];
  if (root.files.length > 0) out.push({ label: null, frames: _toFrames(root.files) });
  const walk = (name: string, node: ScanResult, prefix: string) => {
    const label = prefix ? `${prefix}/${name}` : name;
    if (node.files.length > 0) out.push({ label, frames: _toFrames(node.files) });
    for (const [subName, sub] of Object.entries(node.subdirs)) walk(subName, sub, label);
  };
  for (const [name, sub] of Object.entries(root.subdirs)) walk(name, sub, "");
  return out;
}

async function _loadDDBFrames() {
  let directorySetting: string;
  try {
    directorySetting = utils.getSetting<string>("frame-image-upload-directory");
  } catch {
    return null; // settings not yet registered
  }
  if (!directorySetting) return null;
  const dir = FileHelper.parseDirectory(directorySetting);
  try {
    const scan = await _scanDirectory(dir.activeSource, dir.current, dir.bucket);
    const subsections = _toSubsections(scan);
    if (subsections.length === 0) return null;
    return { subsections };
  } catch (err) {
    logger.debug("DDB tokenizer-2 loader: directory scan failed", err);
    return null;
  }
}

export function registerTokenizer2FrameLoader() {
  Hooks.on("tokenizer-2.registerFrames", (registry: any) => {
    if (!registry || typeof registry.registerLoader !== "function") return;
    registry.registerLoader({
      id: LOADER_ID,
      label: `${SETTINGS.MODULE_ID}.tokenizer2.frames-tab-label`,
      load: _loadDDBFrames,
    });
  });
}

// Force tokenizer-2 to re-scan the DDB frames folder on the next Frame Browser
// open. Safe to call when tokenizer-2 isn't active.
export function clearDDBFrameCache() {
  try {
    const mod: any = game.modules.get("tokenizer-2");
    const reg = mod?.active && mod?.api?.frameRegistry;
    if (reg && typeof reg.clearCache === "function") reg.clearCache(LOADER_ID);
  } catch (err) {
    logger.debug("clearDDBFrameCache failed", err);
  }
}
