/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BrutalStrike extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Forceful Blow",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" })],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Hamstrung Blow",
          type: "damage",
        },
        build: {
          generateActivation: true,
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" }),
          ],
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Hamstrung",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("-15", 90, "system.attributes.movement.walk"),
        ],
        data: {
          "flags.ddbimporter.activityMatch": "Hamstrung Blow",
        },
      },
    ];
  }

}
