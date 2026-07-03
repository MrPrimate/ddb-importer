export {};

global {

  // action payload data is merged onto these definitions by the parser, so
  // intersect with the action-backed shape for the fields feature parsing reads
  type TDDBFeatureMixinDefinitions = (IDDBClassFeatureDefinition | IDDBRacialTraitDefinition | IDDBFeatDefinition | IDDBBackgroundDefinition) & IDDBActionBackedDefinition;

  type TDDBFeatureMixinFeatures = IDDBClassFeature | IDDBRacialTrait | IDDBFeat | IDDBBackground;

  type TDDBFeatureMixinEnrichers = DDBGenericEnricher | DDBFeatEnricher | DDBSpeciesTraitEnricher | DDBClassFeatureEnricher | DDBBackgroundEnricher;

  type T5eFeatureMixinDataTypes = I5eBackgroundItem | I5eWeaponItem | I5eFeatItem | I5eBackgroundItem;

  interface IDDBFeaturesAdvancementLinkData {
    _id: string;
    features: Record<string, string>;
  }

}
