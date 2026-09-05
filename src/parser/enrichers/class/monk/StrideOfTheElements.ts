import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Elements level 11. The fly and swim speeds only apply while Elemental Attunement
 * is active, so ElementalAttunement carries them as a rider on its level 11+ enchantment profile;
 * this document is description only.
 */
export default class StrideOfTheElements extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [];
  }

}
