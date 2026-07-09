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

}
