/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ImprovedBrutalStrike extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      type: "damage",
      targetType: "creature",
      name: "Staggering Blow",
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
          name: "Staggering Blow",
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
        name: "Staggered",
        changes: [],
        activityMatch: "Staggering Blow",
      },
      {
        name: "Sundered",
        changes: [],
        activityMatch: "Sundering Blow",
      },
    ];
  }

}
