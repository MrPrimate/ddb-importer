/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class ArcaneVigor extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast Spell",
    };
  }

  get effects() {
    return [4, 6, 8, 10, 12]
      .map((die) => {
        return {
          constructor: {
            name: `Spend spells level HD (d${die})`,
            type: "heal",
          },
          build: {
            generateDamage: false,
            generateHealing: true,
            generateRange: true,
            generateConsumption: true,
            healingPart: DDBEnricherMixin.basicDamagePart({
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
  }

}
