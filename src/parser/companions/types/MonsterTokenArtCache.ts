/**
 * The lookup cache behind MonsterTokenArt, kept in a module with no imports. MonsterTokenArt pulls
 * in the monster parser, so the muncher app cannot import it statically without closing a module
 * cycle (the release bundle then hits DDBMonster before it is initialised); the app clears the
 * cache through this module instead.
 *
 * Found art is kept for the page load. A creature neither the compendium nor DDB has art for is
 * remembered only briefly, and a lookup that failed or could not run is not remembered at all, so
 * munching the monster (or fixing the setting or connection) is picked up on the next lookup.
 */

export const RESOLVED_TOKEN_ART = new Map<string, string>();
export const MISSED_TOKEN_ART = new Map<string, number>();
export const PENDING_TOKEN_ART = new Map<string, Promise<string | null>>();
export const TOKEN_ART_MISS_TTL_MS = 5 * 60_000;

/** Forget every remembered lookup, e.g. when a monster munch may have added the missing art. */
export function clearMonsterTokenArtCache(): void {
  RESOLVED_TOKEN_ART.clear();
  MISSED_TOKEN_ART.clear();
}
