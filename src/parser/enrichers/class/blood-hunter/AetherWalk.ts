import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";

/**
 * Order of the Ghostslayer, 7th level. Steps into the veil between the planes
 * for a number of rounds equal to the hemocraft modifier.
 *
 * The force damage for ending a turn inside an object, and the shunt damage on
 * expiry, are applied manually.
 */
export default class AetherWalk extends _BloodHunter {

  static SCALE = "@scale.order-of-the-ghostslayer.aether-walk";

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Aether Walk",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "At the start of your turn, while not incapacitated",
      // spends one of the feature's own uses
      addItemConsume: true,
      data: {
        // an active effect duration is numeric, so the formula lives here only
        duration: {
          value: `max(1, ${this.hemocraftModifier})`,
          units: "round",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Between Planes",
        activityMatch: "Aether Walk",
        options: {
          description: "Move through other creatures and objects as if they were difficult terrain, and see and affect creatures and objects on the Ethereal Plane. Lasts a number of rounds equal to your Hemocraft modifier (minimum of 1 round).",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Aether Walk",
        max: AetherWalk.SCALE,
        period: "sr",
      }),
    };
  }

}
