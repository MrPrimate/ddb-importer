/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Healer extends DDBEnricherData {

  get activity() {
    if (this.is2024) {
      return null;
    } else {
      return {
        name: "Stabilize",
        type: "heal",
        targetType: "creature",
        activationType: "special",
        activationCondition: "Use a healers kit to stabalize a creature",
        data: {
          healing: DDBEnricherData.basicDamagePart({ bonus: "1", type: "healing" }),
        },
      };
    }
  }

  get additionalActivities() {
    if (this.is2024) {
      return [4, 6, 8, 10, 12]
        .map((die) => {
          return {
            constructor: {
              name: `Healing (d${die})`,
              type: "heal",
            },
            build: {
              generateDamage: false,
              generateHealing: true,
              generateRange: true,
              healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: die, bonus: "@prof", type: "healing" }),
            },
          };
        });
    } else {
      return [

      ];
    }
  }

}
