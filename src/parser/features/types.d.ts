export {};

global {

  /**
   * Fields that exist on some (not all) of the definition kinds below, plus
   * fields the parser injects (className/subclassName). Feature parsing reads
   * these generically across kinds, so they are exposed as optionals here.
   */
  interface IDDBFeatureDefinitionKindFields {
    classId?: number | null;
    className?: string | null;
    subclassName?: string | null;
    requiredLevel?: number | null;
    componentTypeId?: number | null;
    displayOrder?: number | null;
    featureType?: number | null;
    entityId?: number | null;
    entityRaceId?: number | null;
    entityType?: string | null;
    // custom actions carry a string entityTypeId; all other kinds send a number
    entityTypeId?: number | string | null;
    grantedFeats?: IDDBClassFeatureGrantedFeat[];
    primaryAbilities?: number[] | null;
    // injected by the infusion parser
    infusionFlags?: Record<string, any> | null;
    // injected by the proxy for some features
    hintImage?: string | null;
  }

  // action payload data is merged onto these definitions by the parser, so
  // intersect with the action-backed shape for the fields feature parsing reads
  type TDDBFeatureMixinDefinitions = (IDDBClassFeatureDefinition | IDDBRacialTraitDefinition | IDDBFeatDefinition | IDDBBackgroundDefinition | TDDBActionTypes) & IDDBActionBackedDefinition & IDDBFeatureDefinitionKindFields;

  type TDDBFeatureMixinFeatures = IDDBClassFeature | IDDBRacialTrait | IDDBFeat | IDDBBackground | IDDBGeneratedBackground;

  type TDDBFeatureMixinAll = TDDBFeatureMixinFeatures | TDDBFeatureMixinDefinitions | TDDBActionTypes;

  type TDDBFeatureMixinEnrichers = DDBGenericEnricher | DDBFeatEnricher | DDBSpeciesTraitEnricher | DDBClassFeatureEnricher | DDBBackgroundEnricher;

  type T5eFeatureMixinDataTypes = I5eBackgroundItem | I5eWeaponItem | I5eFeatItem | I5eBackgroundItem;

  type TDDBActionTypes = IDDBAction | IDDBConfigNaturalAction | IDDBCustomAction;

  // Raw DDB shapes accepted by scale-value lookup. It reads only componentId /
  // levelScale / flags defensively, so it does not need the action-backed mixin
  // intersection (which conflicts on IDDBCustomAction.range).
  type TDDBScaleValueSource =
    | TDDBFeatureMixinAll
    | IDDBClass
    | TDDBActionTypes
    | IDDBInfusionDefinition
    | IDDBClassFeatureDefinition
    | IDDBRacialTraitDefinition
    | IDDBFeatDefinition
    | IDDBBackgroundDefinition;

  interface IDDBFeaturesAdvancementLinkData {
    _id: string;
    features: Record<string, string>;
  }
}
