import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The Coven: a Reaction imposes Disadvantage on a creature studying your illusion, and the first
 * creature to see through an illusion spell takes Psychic damage of 1d6 plus 1d6 per slot level
 * (scaling step = slot level - 1), Charisma modifier times (minimum once) per short or long rest.
 */
export default class HagsGuile extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Illusion Backlash",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "A creature first sees through your illusion spell with a Study action",
      addItemConsume: true,
      data: {
        consumption: {
          scaling: { allowed: true, max: "8" },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Impose Disadvantage",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "A creature takes a Study action to examine an illusion you created",
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Hag's Guile",
        max: "max(1, @abilities.cha.mod)",
        period: "sr",
      }),
    };
  }

}
