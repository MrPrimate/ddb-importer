import { logger, FolderHelper } from "../../../lib/_module";
import MonsterReplacer from "../../../apps/MonsterReplacer";
import AdventureMunchHelpers from "../AdventureMunchHelpers";
import { scanIds } from "./NativeShared";
import { getNativeSessionCache } from "./NativeSessionCache";
import type { ContentRow } from "./ContentRowProcessor";

const MONSTER_REF_RE = /ddb:\/\/monsters\/(\d+)/g;

/** A selected 2014→2024 monster swap (subset of MonsterReplacer's hint payload). */
export interface MonsterSwap {
  id2014: number;
  id2024: number;
  name2024: string;
}

/** Scan all `ddb://monsters/<id>` ids referenced by the journal rows. */
export function scanMonsterIds(rows: ContentRow[]): number[] {
  return [...scanIds(rows, MONSTER_REF_RE)].map(Number);
}

/**
 * Build the 2014→2024 monster swap map for the native importer (parity with the
 * legacy AdventureMunch._updateMonsterData). Scans the journal-referenced monster
 * ids, fetches the 2024 hints from the proxy, and prompts the user (single
 * chooser dialog) for which to upgrade.
 *
 * Resilient: no cobalt / proxy down / non-supporter / nothing selected → empty
 * map + warn (links + tokens stay 2014).
 */
export async function buildMonsterSwapMap(rows: ContentRow[], adventureName: string): Promise<Map<number, MonsterSwap>> {
  const swap = new Map<number, MonsterSwap>();
  const ids = scanMonsterIds(rows);
  if (ids.length === 0) return swap;

  try {
    const monsterData = await MonsterReplacer.fetchUpdatedMonsterInfo(ids);
    if (!Array.isArray(monsterData) || monsterData.length === 0) return swap;

    const replacer = new MonsterReplacer({ name: adventureName });
    const selectedIds: number[] = await replacer.chooseMonstersToReplace(monsterData);
    if (selectedIds.length === 0) return swap;

    for (const data of monsterData) {
      if (!selectedIds.includes(data.id2014)) continue;
      swap.set(Number(data.id2014), {
        id2014: Number(data.id2014),
        id2024: Number(data.id2024),
        name2024: data.name2024,
      });
    }
    logger.info(`NativeMonsterImporter: ${swap.size} monster(s) selected for 2014→2024 replacement`);
  } catch (error) {
    logger.warn(`NativeMonsterImporter: 2024 monster lookup failed (${(error as Error).message ?? error}); keeping 2014 monsters`);
  }

  return swap;
}

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
export async function importRequiredMonsters(rows: ContentRow[], swap?: Map<number, MonsterSwap>): Promise<void> {
  const ids = scanIds(rows, MONSTER_REF_RE);
  if (ids.size === 0) return;

  // Apply the 2014→2024 swap so the 2024 target ids get imported (unswapped
  // ids pass through unchanged). Dedup via Set in case two 2014 ids collapse.
  const mapped = new Set<number>([...ids].map((id) => swap?.get(Number(id))?.id2024 ?? Number(id)));

  // Skip monsters already handled this session (avoids re-querying the
  // compendium index for ids confirmed present / imported earlier).
  const session = getNativeSessionCache();
  const candidates = [...mapped].filter((id) => !session.importedMonsterIds.has(String(id)));
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
