export {};

declare global {
  /** Runtime arguments share the behavior editor's targeting and owner-turn options. */
  interface IUseActivityArgs extends Omit<I5eActivityBehaviorMacroConfig, "args" | "events" | "function" | "activity" | "macroName" | "macroParameters"> {
    activityName?: string;
    activityId?: string;
    dispositions?: number[];
    macroParameters?: string | Record<string, unknown>;
    expiresAt?: number;
    fallbackExpiresAt?: number;
    placementCombatId?: string;
  }

  /** Stored on the placed behavior; dispatch never interprets its script. */
  interface IOwnerTurnBehavior {
    events: string[];
    args: IUseActivityArgs & Record<string, unknown>;
  }

  interface IRegionTargetRequest {
    id: string;
    actorUuid: string;
    regionUuid: string;
    title: string;
    instruction: string;
    tokenUuids: string[];
    activities: { id: string; name: string; max?: number }[];
    max: number;
  }

  interface IRegionTargetChoice {
    tokens: string[];
    activity: string;
  }
}
