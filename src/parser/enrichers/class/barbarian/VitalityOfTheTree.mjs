/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class VitalityOfTheTree extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Vitality Surge",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "You enter a rage.",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.barbarian.levels",
          types: ["temphp"],
        }),
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Life-Giving Force",
          type: "heal",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          rangeOverride: {
            value: "10",
            units: "ft",
          },
          activationOverride: {
            type: "special",
            value: 1,
            condition: "At the start of each of your turns (whilst raging)",
          },
          targetOverride: {
            affects: {
              value: "1",
              type: "ally",
            },
          },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "(@scale.barbarian.rage-damage)d4", type: "temphp" }),
        },
      },
    ];
  }

}
