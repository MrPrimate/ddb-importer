import _FamiliarFeat from "./_FamiliarFeat";

/**
 * AU general feat. Otherworldly Power imbues the familiar as Find Familiar is cast: one summon per
 * damage type, each giving the familiar Resistance to it. Phase Walk (moving through creatures and
 * objects) has no automation and stays in the effect description.
 */
export default class OtherworldlyFamiliar extends _FamiliarFeat {

  static DAMAGE_TYPES = ["necrotic", "poison", "psychic", "radiant", "thunder"];

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
    return _FamiliarFeat.imbuedSummons("Otherworldly", "otherFam", OtherworldlyFamiliar.DAMAGE_TYPES);
  }

  override get effects(): IDDBEffectHint[] {
    return _FamiliarFeat.imbuedEffects(
      "Otherworldly",
      OtherworldlyFamiliar.DAMAGE_TYPES,
      "The familiar can move through creatures and objects as Difficult Terrain, and has",
    );
  }

}
