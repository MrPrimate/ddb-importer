/**
 * Session-scoped cache for the Native Adventure Importer.
 *
 * Lives on `CONFIG.DDBI.NATIVE` for the whole Foundry session (same lifetime as
 * CONFIG.DDBI.MAPS / META / KNOWN), so repeat imports - more maps from the same
 * book, the standalone adventure browser, or the API - skip work already done
 * this session:
 *  - `journalBundles`: per-book journal import result (journals + page lookup),
 *    so DDBMaps' `_ensureJournalsForBook` reuses it instead of re-running the
 *    whole `importBook` pipeline.
 *  - `rulebookSources`: `${type}:${sortedSourceIds}` keys confirmed present, so
 *    the bulk rulebook spell/item import isn't re-checked/re-run.
 *  - `imported{Spell,Item,Monster}Ids`: ddb ids confirmed present / imported, so
 *    the compendium index isn't re-queried for them.
 *
 * Lazily ensured (works for sessions started before this code existed) and
 * cleared via the Map Browser's Reload button (`clearNativeSessionCache`).
 */

import type { IDDBIConfig } from "../../../hooks/ready/registerGameSettings";

export type NativeSessionCache = NonNullable<IDDBIConfig["NATIVE"]>;

export function getNativeSessionCache(): NativeSessionCache {
  CONFIG.DDBI.NATIVE ??= {
    journalBundles: new Map(),
    rulebookSources: new Set(),
    importedSpellIds: new Set(),
    importedItemIds: new Set(),
    importedMonsterIds: new Set(),
  };
  return CONFIG.DDBI.NATIVE;
}

export function clearNativeSessionCache(): void {
  delete CONFIG.DDBI.NATIVE;
}
