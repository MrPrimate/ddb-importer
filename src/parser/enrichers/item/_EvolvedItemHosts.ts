/**
 * Which items compendiums already hold the evolved-item host feats, kept in a module with no
 * imports so the items muncher can reset it without importing the enricher tree.
 */

/** Compendium ids whose host feats were written by a completed build. */
export const HOST_ITEMS_BUILT = new Set<string>();

/** Builds still running, so parallel item parses share one write per compendium. */
export const HOST_ITEMS_BUILDING = new Map<string, Promise<void>>();

/**
 * Forget which compendiums have their host feats, so the next munch writes them again: after
 * the spells they cast have been munched, a re-munch links them.
 */
export function resetEvolvedHostItems(): void {
  HOST_ITEMS_BUILT.clear();
}
