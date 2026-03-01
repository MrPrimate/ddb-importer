import DDBEnricherData from "../data/DDBEnricherData";

export default class Healer extends DDBEnricherData {

  get activity() {
    if (this.is2024) {
      return null;
    } else {
      return {
        name: "Stabilize",
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
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
            init: {
              name: `Healing (d${die})`,
              type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
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
