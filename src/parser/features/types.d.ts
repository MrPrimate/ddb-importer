export {};

global {

  type TDDBFeatureMixinDefinitions = IDDBClassFeatureDefinition | IDDBRacialTraitDefinition | IDDBFeatDefinition | IDDBBackgroundDefinition;

  type TDDBFeatureMixinFeatures = IDDBClassFeature | IDDBRacialTrait | IDDBFeat | IDDBBackground;

  type TDDBFeatureMixinEnrichers = DDBGenericEnricher | DDBFeatEnricher | DDBSpeciesTraitEnricher | DDBClassFeatureEnricher | DDBBackgroundEnricher;

  type T5eFeatureMixinDataTypes = I5eBackgroundItem | I5eWeaponItem | I5eFeatItem;

}
