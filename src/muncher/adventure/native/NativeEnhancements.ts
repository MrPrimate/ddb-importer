import { logger, DDBProxy, PatreonHelper, Secrets } from "../../../lib/_module";
import { ensureAssetsPrefix } from "./NativeShared";

/**
 * Adventure image enhancements - higher-quality replacement images served by the
 * proxy. Mirrors the muncher's `getEnhancedData` (ddb-adventure-muncher/munch/data/enhance.js).
 *
 * Endpoint: POST {proxy}/proxy/adventure/enhancement
 * body { cobalt, bookId } → { success, data: [{ img, bookCode, scene_img?, hiresImg, ... }] }.
 * Enhancements are optional: any failure degrades to an empty list.
 */

export async function fetchEnhancements(bookId: number | string): Promise<any[]> {
  const cobalt = Secrets.getCobalt();
  if (!cobalt) return [];
  try {
    const response = await fetch(`${DDBProxy.getProxy()}/proxy/adventure/enhancement`, {
      method: "POST",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cobalt, betaKey: PatreonHelper.getPatreonKey(), bookId: Number(bookId) }),
    });
    const json = await response.json();
    if (!json.success) {
      logger.info(`No enhancement data for book ${bookId}: ${json.message ?? "unknown"}`);
      return [];
    }
    const data: any[] = json.data ?? [];
    logger.info(`NativeEnhancements: ${data.length} enhancement entries for book ${bookId}`);
    return data;
  } catch (error) {
    logger.warn(`NativeEnhancements: fetch failed (${(error as Error).message}); continuing without enhancements`);
    return [];
  }
}

/** Map `assets/<path>` → enhanced `hiresImg` url for every entry that has one.
 *
 * Per-entry keys: `img` (original path, used in journal HTML) and `scene_img`
 * (scene-only override, often points at a player-version map distinct from
 * the DM-version img). Both share the same hiresImg URL. Indexing both ensures
 * NativeAssetHandler's "enhancement-only" phase uploads scene backgrounds that
 * aren't in files.txt, so NativeSceneBuilder can resolve them via the assetMap.
 */
export function buildEnhancedUrlMap(list: any[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of list) {
    if (!entry?.hiresImg) continue;
    if (entry.img) map.set(ensureAssetsPrefix(entry.img), entry.hiresImg);
    if (entry.scene_img && entry.scene_img !== entry.img) {
      map.set(ensureAssetsPrefix(entry.scene_img), entry.hiresImg);
    }
  }
  return map;
}
