/**
 * Pure builders for the RegionBehavior documents created from ddb-importer's
 * `ddbMacro` activity behavior. Kept free of Foundry DataModel classes so they
 * can be unit tested; DDBMacroActivityBehavior delegates to them at placement.
 */

export const REGION_EVENTS = [
  "tokenEnter",
  "tokenExit",
  "tokenMoveIn",
  "tokenMoveOut",
  "tokenMoveWithin",
  "tokenTurnStart",
  "tokenTurnEnd",
  "tokenRoundStart",
  "tokenRoundEnd",
] as const;

export type TRegionEvent = typeof REGION_EVENTS[number];

/** Script source executed by a core "executeScript" RegionBehavior for each configured event. */
export function buildMacroBehaviorSource(handler: string, args: Record<string, unknown> = {}): string {
  return `await DDBImporter.effects.AuraAutomations.handleRegionEvent({ scene, region, behavior, event, handler: ${JSON.stringify(handler)}, args: ${JSON.stringify(args)} });`;
}

export function buildMacroBehaviorData({ handler, events, args = {} }: {
  handler: string;
  events: Iterable<string>;
  args?: Record<string, unknown>;
}) {
  const eventList = [...events].filter((event) => (REGION_EVENTS as readonly string[]).includes(event));
  if (!handler || eventList.length === 0) return false;
  return {
    type: "executeScript",
    system: {
      events: eventList,
      source: buildMacroBehaviorSource(handler, args),
    },
  };
}
