import { logger, FolderHelper } from "../../../lib/_module";
import AdventureMunchHelpers from "../AdventureMunchHelpers";
import { scanIds } from "./NativeShared";
import { getNativeSessionCache } from "./NativeSessionCache";
import type { ContentRow } from "./ContentRowProcessor";

const MONSTER_REF_RE = /ddb:\/\/monsters\/(\d+)/g;

/**
 * Imports the monsters referenced by `ddb://monsters/<id>` links in the adventure
 * into the DDB monster COMPENDIUM (never the world - world actors are a scenes-phase
 * concern). Reuses AdventureMunchHelpers.checkForMissingDocuments, which dedupes
 * against the compendium index and imports only the missing ids via
 * DDBMonsterFactory.processIntoCompendium. Once present, the existing
 * foundryCompendiumReplace resolves the links (after generateAdventureConfig).
 *
 * Optional + resilient: no cobalt / proxy down / non-Patreon → warn and continue
 * (those links fall back to DDB urls).
 */
export async function importRequiredMonsters(rows: ContentRow[]): Promise<void> {
  const ids = scanIds(rows, MONSTER_REF_RE);
  if (ids.size === 0) return;

  // Skip monsters already handled this session (avoids re-querying the
  // compendium index for ids confirmed present / imported earlier).
  const session = getNativeSessionCache();
  const candidates = [...ids].map(Number).filter((id) => !session.importedMonsterIds.has(String(id)));
  if (candidates.length === 0) {
    logger.info(`NativeMonsterImporter: all ${ids.size} referenced monsters handled this session, skipping`);
    return;
  }

  logger.info(`NativeMonsterImporter: ${candidates.length} referenced monsters; importing any missing into the compendium`);
  try {
    await AdventureMunchHelpers.checkForMissingDocuments("monster", candidates);
    candidates.forEach((id) => session.importedMonsterIds.add(String(id)));
  } catch (error) {
    logger.warn(`NativeMonsterImporter: monster import failed (${(error as Error).message}); links will fall back to DDB urls`);
  }
}

/**
 * Import EVERY monster referenced by `ddb://monsters/<id>` links in the adventure
 * into the WORLD as actors, under the `[bookName]` Actor folder (the same folder
 * scene tokens use - see DDBMapMetaData._resolveActorFolderId). This is the
 * world-side "all monsters" option: a superset of the scene-token actors.
 *
 * The referenced monsters must already be in the compendium (importRequiredMonsters
 * runs first in NativeAdventureMunch). Dedup against existing world actors and
 * per-actor resilience live in AdventureMunchHelpers.importMonstersToWorld, shared
 * with the legacy AdventureMunch path.
 */
export async function importAllMonstersToWorld(rows: ContentRow[], bookName: string): Promise<void> {
  const ids = scanIds(rows, MONSTER_REF_RE);
  if (ids.size === 0) return;

  let folderId: string | null = null;
  try {
    const folder = await FolderHelper.getOrCreateFolder(null, "Actor", bookName);
    folderId = (folder as any)?.id ?? null;
  } catch (error) {
    logger.warn(`NativeMonsterImporter: failed to ensure Actor folder "${bookName}" (${(error as Error).message ?? error})`);
  }

  const imported = await AdventureMunchHelpers.importMonstersToWorld([...ids].map(Number), { folderId });
  logger.info(`NativeMonsterImporter: imported ${imported.length} world actor(s) from ${ids.size} referenced monsters into "${bookName}"`);
}
