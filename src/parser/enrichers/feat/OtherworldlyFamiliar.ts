import _FamiliarFeat from "./_FamiliarFeat";

/**
 * AU general feat. Otherworldly Power imbues the familiar as Find Familiar is cast: one summon per
 * damage type, each giving the familiar Resistance to it, plus an enchant that adds rider copies of
 * those summons to the Find Familiar spell. Phase Walk (moving through creatures and objects) has no
 * automation and stays in the effect description.
 */
export default class OtherworldlyFamiliar extends _FamiliarFeat {

  static DAMAGE_TYPES = ["necrotic", "poison", "psychic", "radiant", "thunder"];

  static ENCHANT_NAME = "Otherworldly Power";

  override get type(): IDDBActivityType | null {
    return _FamiliarFeat.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ..._FamiliarFeat.imbuedSummons("Otherworldly", "otherFam", "othrFamR", OtherworldlyFamiliar.DAMAGE_TYPES, this.imbuementDescription("Otherworldly Power")),
      _FamiliarFeat.imbueEnchantActivity(OtherworldlyFamiliar.ENCHANT_NAME),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      ..._FamiliarFeat.imbuedEffects(
        "Otherworldly",
        OtherworldlyFamiliar.DAMAGE_TYPES,
        "The familiar can move through creatures and objects as Difficult Terrain, and has",
      ),
      _FamiliarFeat.imbueEnchantEffect(
        OtherworldlyFamiliar.ENCHANT_NAME, "ddbOthrFamEnchEf", "othrFamR", OtherworldlyFamiliar.DAMAGE_TYPES,
      ),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: _FamiliarFeat.imbuedImplementationDetails("Otherworldly Familiar", OtherworldlyFamiliar.ENCHANT_NAME),
    };
  }

}
