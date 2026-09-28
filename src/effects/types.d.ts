export {};

global {
  // Effects freshly built by AutoEffects.BaseEffect always have these containers initialized,
  // unlike arbitrary I5eEffectData which may omit them.
  export type TInitializedEffect = I5eEffectData & {
    system: I5eEffectSystem & Required<Pick<I5eEffectSystem, "changes">>;
    duration: IEffectDuration;
    flags: NonNullable<I5eEffectData["flags"]> & {
      dae: NonNullable<NonNullable<I5eEffectData["flags"]>["dae"]>;
    };
  };

  /** A region event as `RegionAutomations` handlers receive it. */
  interface IRegionEventContext {
    scene: Scene;
    region: RegionDocument;
    behavior: RegionBehavior;
    event: {
      name: string;
      data: Record<string, any>;
      region: RegionDocument;
      user: User;
    };
    handler: string;
    args: Record<string, unknown>;
  }

  /**
   * Display data for one activity-placed template Region offered for removal.
   */
  interface IRegionExpiryEntry {
    region: RegionDocument;
    uuid: string;
    name: string;
    img: string;
    itemName: string | null;
    activityName: string | null;
    shape: string | null;
    size: string | null;
    spellLevel: number | string | null;
    behaviors: string[];
    effectCount: number;
    reason: string;
  }
}
