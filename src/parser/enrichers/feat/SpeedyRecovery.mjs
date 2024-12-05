/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpeedyRecovery extends DDBEnricherData {
  get type() {
    return "none";
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
            type: "bonus",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: `@attributes.hd.${size.toLowerCase()}Available`,
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
