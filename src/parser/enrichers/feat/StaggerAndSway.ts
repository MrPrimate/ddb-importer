import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Stagger and Sway (World of Warcraft): Defer Damage reduces each damage taken by the Dex mod and
 * adds a d6 to a Delayed Reaction pool rolled as Force damage at the end of the turn. The reduction
 * and pool stay description (the pool is per turn). Purify is the Bonus Action that removes Wis mod
 * dice; the end-of-turn roll is its own damage activity, scaled by the number of dice left.
 */
export default class StaggerAndSway extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Delayed Reaction",
      activationType: "turnEnd",
      activationCondition: "Roll the dice in your Delayed Reaction pool",
      targetType: "self",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["force"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Purify",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "Remove up to your Wisdom modifier in dice from your Delayed Reaction pool",
          },
          targetOverride: {
            override: true,
            affects: { type: "self" },
          },
        },
      },
    ];
  }

}
