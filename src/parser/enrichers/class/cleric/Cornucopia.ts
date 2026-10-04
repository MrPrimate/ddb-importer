import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Harvest Domain: once per long rest, a short rest feast lets you share Cleric-level d4s of healing
 * among the creatures who ate. Each creature's share is one use of the heal: the scaling step adds a
 * die, up to the whole pool.
 */
export default class Cornucopia extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Cornucopia",
      targetType: "self",
      activationType: "special",
      activationCondition: "You start a Short Rest without the Incapacitated condition",
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Share the Harvest",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 4,
            types: ["healing"],
            scalingMode: "whole",
            scalingNumber: 1,
          }),
          activationOverride: { type: "special", value: 1, condition: "A creature who ate the food finishes the Short Rest" },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          data: {
            consumption: { targets: [], scaling: { allowed: true, max: "@classes.cleric.levels - 1" } },
          },
        },
      },
    ];
  }

}
