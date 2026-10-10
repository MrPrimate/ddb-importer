export {};

global {
  /** A summons entry in the proxy's enriched image data, keyed by the summon's name. */
  interface IDDBEnrichedSummonImage {
    monster?: string | null;
    monsterID?: number | null;
    // DDB monsters whose art is used; only the first one returned is read
    monsterIDs?: number[];
    actor?: string | null;
    token?: string | null;
  }

  interface IDDBEnrichedImageData extends IDDBEnrichedSummonImage {
    snips?: IDDBImageSnipEntry;
  }

  interface IDDBCompanionMixinOptions {
    type?: string;
    subType?: string;
    rules?: T5eRulesVersion;
    name?: string;
    folderHint?: string;
    forceRulesVersion?: string;
    // a multi-form stat block's combined actor, built only to be embedded in the description
    template?: boolean;
  }

  /**
   * The text dnd5e shows in place of an embedded NPC stat block's computed values
   * (`flags.dnd5e.statBlockOverride`, dnd5e 5.2+).
   */
  interface IDDBStatBlockOverride {
    ac?: string;
    hp?: string;
    speed?: string;
    tag?: string;
    cr?: string;
    xp?: string;
    pb?: string;
    vulnerabilities?: string;
    resistances?: string;
    immunities?: string;
    conditionImmunities?: string;
  }

  /** The raw stat block lines a companion parser hands to its stat block override. */
  interface IDDBStatBlockOverrideText {
    ac?: string | null;
    hp?: string | null;
    speed?: string | null;
    tag?: string | null;
    challenge?: string | null;
    vulnerabilities?: string | null;
    resistances?: string | null;
    immunities?: string | null;
    conditionImmunities?: string | null;
  }

  /** A stat block in an origin document's description and the companion actors built from it. */
  interface IDDBCompanionStatBlock {
    name: string;
    companionIds: string[];
    templateId: string | null;
  }

  interface IDDBCompanionMixinParserOptions {
    addMonsterEffects?: boolean;
    removeSplitCreatureActions?: boolean;
    removeCreatureOnlyNames?: boolean;
    addChrisPremades?: boolean;
    useItemAC?: boolean;
    legacyName?: boolean;
  }

  // DDBCompanionMixin always initialises these summon sub-objects in its
  // constructor, so they are required here.
  interface IDDBCompanionSummons extends I5eSummonActivity {
    match: I5eSummonsMatch;
    bonuses: I5eSummonsBonuses;
    creatureSizes: TActorSizes[];
    creatureTypes: TCreatureTypes[];
    profiles: I5eSummonProfile[];
    summon: I5eActivitiesSummon;
  }

}
