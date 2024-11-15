/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GreenFlameBlade extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      data: {
        name: "Secondary Target Damage",
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ bonus: "@mod", types: ["fire"], scalingMode: "whole", scalingFormula: "1d8" }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Main Weapon Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "(ceil((@details.level+1)/6))d8", types: ["fire"], scalingMode: "none" })],
        },
      },
    ];
  }

  get effects() {
    return [
      {
        data: {
          "system.range": {
            value: "5",
            units: "ft",
          },
          "system.target.template": {
            size: "",
            type: "",
          },
        },
      },
    ];
  }

}
