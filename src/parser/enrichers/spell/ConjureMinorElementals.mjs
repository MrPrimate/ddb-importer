/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ConjureMinorElementals extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Extra Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          noTemplate: true,
          data: {
            range: {
              units: "ft",
              value: "15",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  denomination: 8,
                  number: 2,
                  types: ["acid", "cold", "fire", "lightning"],
                  scalingMode: "whole",
                  scalingNumber: 1,
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [{
      name: "Conjured Minor Elementals",
      activityMatch: "Cast",
      options: {
        durationSeconds: 600,
      },
    }];
  }
}
