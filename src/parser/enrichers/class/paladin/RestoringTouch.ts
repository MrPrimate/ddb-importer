import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * 2024 Paladin: alongside Lay On Hands, remove Blinded, Charmed, Deafened, Frightened, Paralyzed or
 * Stunned at 5 points from the pool each. The base cost is one condition; each scaling step adds one.
 */
export default class RestoringTouch extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Remove Conditions",
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      activationCondition: "When you use Lay On Hands on a creature",
      addItemConsume: true,
      itemConsumeTargetName: "Lay On Hands",
      itemConsumeValue: "5",
      addScalingMode: "amount",
      addScalingFormula: "5",
      data: {
        range: {
          override: true,
          units: "touch",
        },
        consumption: {
          scaling: {
            allowed: true,
            max: "5",
          },
        },
      },
    };
  }

}
