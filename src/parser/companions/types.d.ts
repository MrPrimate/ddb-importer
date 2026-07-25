export {};

global {
  interface IDDBCompanionMixinOptions {
    type?: string;
    subType?: string;
    rules?: T5eRulesVersion;
    name?: string;
    folderHint?: string;
    forceRulesVersion?: string;
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
