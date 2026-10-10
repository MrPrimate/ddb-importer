import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * College of Lore: after a roll (any ability check in 2014; a failed check or attack roll in 2024),
 * spend Bardic Inspiration and add the die to the d20. DDB's 2024 action is an action with a fixed
 * d12; the die follows the bard's scale and the activation is the roll itself.
 */
export default class PeerlessSkill extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: this.is2014
        ? "You make an ability check"
        : "You fail an ability check or attack roll",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "@scale.bard.inspiration",
          name: "Bardic Inspiration Die",
        },
      },
    };
  }

}
