/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class InvocationLifedrinker extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["necrotic", "psychic", "radiant"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    return ["Smallest", "Largest"].map((size) => {
      return {
        constructor: {
          name: `Healing - ${size} Hit Die`,
          type: "heal",
        },
        build: {
          generateConsumption: true,
          generateTarget: false,
          targetSelf: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "Once per turn when you hit a creature with your pact weapon",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: `@attributes.hd.${size.toLowerCase()}Available + (max(1,@abilities.con.mod))`,
            type: "healing",
          }),
          consumptionOverride: {
            targets: [
              {
                type: "hitDice",
                target: size.toLowerCase(),
                value: 1,
                scaling: {
                  mode: "",
                  formula: "",
                },
              },
            ],
            scaling: {
              allowed: false,
              max: "",
            },
          },
        },
      };
    });
  }
}
