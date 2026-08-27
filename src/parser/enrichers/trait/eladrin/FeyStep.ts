import DDBEnricherData from "../../data/DDBEnricherData";

export default class FeyStep extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Fey Step (Teleport)",
      targetType: "self",
      activationType: "bonus",
      overrideActivation: true,
      data: {
        range: {
          override: true,
          value: "30",
          units: "ft",
          special: "",
        },
        target: {
          override: true,
          prompt: false,
          affects: {
            count: "1",
            type: "self",
          },
          template: {},
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
          name: "Summer (Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateDamage: true,
          generateTarget: true,
        },
        overrides: {
          noConsumeTargets: true,
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

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
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
