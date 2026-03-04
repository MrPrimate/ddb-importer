import DDBEnricherData from "../../data/DDBEnricherData";

export default class FeyStep extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Fey Step (Teleport)",
      targetType: "self",
      activationType: "bonus",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Autumn (Save)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
        init: {
          name: "Winter (Save)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
        init: {
          name: "Summer (Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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

  get effects(): IDDBEffectHint[] {
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
        daeSpecialDurations: ["turnEndSource" as const],
        activityMatch: "Winter (Save)",
      },
    ];
  }

}
