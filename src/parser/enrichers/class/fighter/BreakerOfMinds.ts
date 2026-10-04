import DDBEnricherData from "../../data/DDBEnricherData";

/** Blade Breaker: a bonus action and up to 3 maneuver points deal 1d6 psychic per point to a creature you are grappling. */
export default class BreakerOfMinds extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      activationCondition: "You are grappling the creature",
      addItemConsume: true,
      itemConsumeTargetName: "maneuver-points",
      itemConsumeValue: 1,
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        consumption: {
          scaling: { allowed: true, max: "2" },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["psychic"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

}
