import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";

/**
 * Order of the Mutant, 18th level. A bonus action to end one mutagen affecting you and replace
 * it with another you know the formula for.
 *
 * Which mutagen is swapped for which is the player's choice, so the effects live on the
 * "Formula: <Name>" documents; this is just the action and its uses.
 */
export default class ExaltedMutation extends _BloodHunter {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      noTemplate: true,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Exalted Mutation",
        max: `max(1, ${this.hemocraftModifier})`,
        period: "lr",
      }),
    };
  }

}
