import { logger, utils, DDBSources, CompendiumHelper } from "../../../lib/_module";
import { SETTINGS } from "../../../config/_module";
import { parseSpells } from "../../spells";
import DDBItemsImporter from "../../DDBItemsImporter";
import AdventureMunchHelpers from "../AdventureMunchHelpers";
import { scanIds } from "./NativeShared";
import { getNativeSessionCache } from "./NativeSessionCache";
// ContentRow is declared globally in ./types.d.ts.

/**
 * Before importing monsters, import the spells + items referenced in the
 * adventure (by ddbId), and bulk-import the core rulebook spells + items for
 * the book's edition (2014 / 2024) so monster stat blocks and adventure text
 * resolve their references. Always into the compendiums (never world).
 *
 * Edition is selected from the book's DDB source category:
 *   1 or 26 → sources [1, 2]    (2014 core)
 *   24 or 38 → sources [148, 145] (2024 core)
 *   otherwise → DDBSources.is2024Source({sourceId: source.id}) → [148, 145];
 *               DDBSources.is2014Source / fallback → [1, 2].
 *
 * Heavy on first run; toggles `munching-policy-update-existing` to false for the
 * duration (restored in finally) so existing docs aren't re-updated.
 */

function resolveRulebookSources(bookCode: string): number[] {
  const source = CONFIG.DDB.sources.find((s: IDDBConfigSource) => s.name.toLowerCase() === bookCode.toLowerCase());
  if (!source) return [];
  const cat = source.sourceCategoryId;
  if (cat === 1 || cat === 26) return [1, 2];
  if (cat === 24 || cat === 38) return [148, 145];
  // is2014/is2024Source read source.sourceId; the book source uses `id`.
  if (DDBSources.is2024Source({ sourceId: source.id })) return [148, 145];
  return [1, 2];
}

/**
 * Whether the target compendium already holds any document from one of the
 * given DDB source ids. Spells store sources as an array; items store a single
 * source id - DDBSources.getDocumentSourceIds covers both. Missing compendium
 * => nothing imported yet => false (so the bulk import runs).
 */
async function compendiumHasAnySource(type: "spells" | "items", sourceIds: number[]): Promise<boolean> {
  const pack = CompendiumHelper.getCompendiumType(type, false);
  if (!pack) return false;
  const index = await pack.getIndex({
    fields: ["flags.ddbimporter.sources", "flags.ddbimporter.dndbeyond.sourceId"],
  });
  return index.some((entry) => DDBSources.getDocumentSourceIds(entry).some((id) => sourceIds.includes(id)));
}

export async function importSpellsAndItems(rows: ContentRow[], bookCode: string): Promise<void> {
  const spellIds = scanIds(rows, /ddb:\/\/spells\/(\d+)/g);
  const itemIds = scanIds(rows, /ddb:\/\/(?:magicitems|weapons|armor|adventuring-gear)\/(\d+)/g);
  const rulebookSources = resolveRulebookSources(bookCode);
  const session = getNativeSessionCache();

  logger.info(`NativeSpellItemImporter: ${spellIds.size} referenced spells, ${itemIds.size} referenced items, rulebook sources [${rulebookSources.join(",")}] for ${bookCode}`);

  // Reduce overhead: skip updating existing docs during this run.
  const prevUpdate = utils.getSetting<boolean>("munching-policy-update-existing");
  try {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-update-existing", false);

    // bulk core rulebook (filtered by source ids) - skip per-type when the
    // compendium already holds docs from these sources, or when we already
    // confirmed/imported these sources this session (avoids the index query).
    if (rulebookSources.length > 0) {
      const sourceKey = rulebookSources.slice().sort((a, b) => a - b).join(",");
      const spellSourceKey = `spells:${sourceKey}`;
      const itemSourceKey = `items:${sourceKey}`;

      if (session.rulebookSources.has(spellSourceKey)) {
        logger.info(`NativeSpellItemImporter: spell sources [${sourceKey}] handled this session, skipping bulk spell import`);
      } else if (await compendiumHasAnySource("spells", rulebookSources)) {
        logger.info(`NativeSpellItemImporter: spell compendium already has sources [${sourceKey}], skipping bulk spell import`);
        session.rulebookSources.add(spellSourceKey);
      } else {
        try {
          await parseSpells({ sources: rulebookSources });
          session.rulebookSources.add(spellSourceKey);
        } catch (error) {
          logger.warn(`NativeSpellItemImporter: bulk spell import failed (${(error as Error).message})`);
        }
      }

      if (session.rulebookSources.has(itemSourceKey)) {
        logger.info(`NativeSpellItemImporter: item sources [${sourceKey}] handled this session, skipping bulk item import`);
      } else if (await compendiumHasAnySource("items", rulebookSources)) {
        logger.info(`NativeSpellItemImporter: item compendium already has sources [${sourceKey}], skipping bulk item import`);
        session.rulebookSources.add(itemSourceKey);
      } else {
        try {
          await DDBItemsImporter.fetchAndImportItems({ useSourceFilter: true, sources: rulebookSources });
          session.rulebookSources.add(itemSourceKey);
        } catch (error) {
          logger.warn(`NativeSpellItemImporter: bulk item import failed (${(error as Error).message})`);
        }
      }
    }

    // referenced spells/items (by ddb id) - covers adventure-specific content.
    // Filter out ids already handled this session before querying the index;
    // mark present-in-compendium ids immediately and imported ids on success.
    if (spellIds.size > 0) {
      const candidates = [...spellIds].filter((id) => !session.importedSpellIds.has(String(id)));
      if (candidates.length === 0) {
        logger.info(`NativeSpellItemImporter: all ${spellIds.size} referenced spells handled this session, skipping`);
      } else {
        const missing = await AdventureMunchHelpers.getMissingIds("spell", candidates);
        const missingSet = new Set(missing.map((m) => String(m)));
        candidates.filter((id) => !missingSet.has(String(id))).forEach((id) => session.importedSpellIds.add(String(id)));
        if (missing.length > 0) {
          try {
            await parseSpells({ ids: missing });
            missing.forEach((m) => session.importedSpellIds.add(String(m)));
          } catch (error) {
            logger.warn(`NativeSpellItemImporter: referenced spell import failed (${(error as Error).message})`);
          }
        } else {
          logger.info(`NativeSpellItemImporter: all ${candidates.length} referenced spells already present, skipping`);
        }
      }
    }
    if (itemIds.size > 0) {
      const candidates = [...itemIds].filter((id) => !session.importedItemIds.has(String(id)));
      if (candidates.length === 0) {
        logger.info(`NativeSpellItemImporter: all ${itemIds.size} referenced items handled this session, skipping`);
      } else {
        const missing = await AdventureMunchHelpers.getMissingIds("item", candidates);
        const missingSet = new Set(missing.map((m) => String(m)));
        candidates.filter((id) => !missingSet.has(String(id))).forEach((id) => session.importedItemIds.add(String(id)));
        if (missing.length > 0) {
          try {
            await DDBItemsImporter.fetchAndImportItems({ ids: missing.map((s) => Number(s)), useSourceFilter: false });
            missing.forEach((m) => session.importedItemIds.add(String(m)));
          } catch (error) {
            logger.warn(`NativeSpellItemImporter: referenced item import failed (${(error as Error).message})`);
          }
        } else {
          logger.info(`NativeSpellItemImporter: all ${candidates.length} referenced items already present, skipping`);
        }
      }
    }
  } finally {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-update-existing", prevUpdate);
  }
}
