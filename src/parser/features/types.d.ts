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
    entityTypeId?: number | null;
    grantedFeats?: IDDBClassFeatureGrantedFeat[];
    primaryAbilities?: number[] | null;
  }

  // action payload data is merged onto these definitions by the parser, so
  // intersect with the action-backed shape for the fields feature parsing reads
  type TDDBFeatureMixinDefinitions = (IDDBClassFeatureDefinition | IDDBRacialTraitDefinition | IDDBFeatDefinition | IDDBBackgroundDefinition) & IDDBActionBackedDefinition & IDDBFeatureDefinitionKindFields;

  type TDDBFeatureMixinFeatures = IDDBClassFeature | IDDBRacialTrait | IDDBFeat | IDDBBackground;

  type TDDBFeatureMixinEnrichers = DDBGenericEnricher | DDBFeatEnricher | DDBSpeciesTraitEnricher | DDBClassFeatureEnricher | DDBBackgroundEnricher;

  type T5eFeatureMixinDataTypes = I5eBackgroundItem | I5eWeaponItem | I5eFeatItem | I5eBackgroundItem;

  interface IDDBFeaturesAdvancementLinkData {
    _id: string;
    features: Record<string, string>;
  }

}
