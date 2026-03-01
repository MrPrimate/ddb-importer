import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneVigor extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Cast Spell",
    };
  }

  get additionalActivities() {
    const activities = [4, 6, 8, 10, 12]
      .map((die) => {
        return {
          init: {
            name: `Spend spells level HD (d${die})`,
            type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
          },
          build: {
            generateDamage: false,
            generateHealing: true,
            generateRange: true,
            generateConsumption: true,
            healingPart: DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: die,
              bonus: "@mod",
              type: "healing",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
            consumptionOverride: {
              spellSlot: false,
              scaling: {
                allowed: true,
                max: "@item.level",
              },
              targets: [
                {
                  type: "hitDice",
                  target: `d${die}`,
                  value: 2,
                  scaling: {
                    mode: "amount",
                    formula: "1",
                  },
                },
              ],
            },
          },
        };
      });

    return activities;
  }

}
