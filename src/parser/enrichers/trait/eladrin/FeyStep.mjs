/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FeyStep extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Fey Step (Teleport)",
      targetType: "self",
      activationType: "bonus",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Autumn (Save)",
          type: "save",
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateTarget: true,
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
          activationType: "special",
        },
      },
      {
        constructor: {
          name: "Winter (Save)",
          type: "save",
        },
        build: {
          noConsumeTargets: true,
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
        },
      },
      {
        constructor: {
          name: "Summer (Damage)",
          type: "damage",
        },
        build: {
          noConsumeTargets: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: true,
          generateTarget: true,
        },
        overrides: {
          rangeSelf: true,
          activationType: "special",
          data: {
            target: {
              affects: {
                type: "enemy",
              },
              template: {
                contiguous: false,
                type: "radius",
                size: "5",
                units: "ft",
              },
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "min(1, @abilities.cha.mod)",
                  type: "fire",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        name: "Charmed",
        statuses: ["charmed"],
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Autumn (Save)",
      },
      {
        name: "Frightened",
        statuses: ["frightened"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnEndSource"],
        activityMatch: "Winter (Save)",
      },
    ];
  }

}
