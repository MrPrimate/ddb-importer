import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Healing Patches (OTFY), consumables: ripping a patch off is a Bonus Action (an ally can do it as a
 * Magic action while you are Unconscious), and destroys it. The consumable parse defaults the heal to
 * an Action and leaves wondrous consumables in place when spent, so both are set here for every rarity.
 */
export default class HealingPatch extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      activationCondition: "Rip the patch off; an ally within reach can do so as a Magic action while you are Unconscious",
      overrideActivation: true,
      targetType: "self",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        ...this.data.system.uses,
        autoDestroy: true,
      },
    };
  }

}
