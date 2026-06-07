import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelation extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Unleash Celestial Energy",
      addItemConsume: true,
      activationType: "bonus",
      targetType: "self",
      noeffect: true,
      data: {
        midiProperties: { chooseEffects: true },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          noTemplate: true,
          activationType: "special",
          activationCondition: "1/turn",
          targetType: "creature",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              types: ["radiant", "necrotic"],
            }),
          ],
        },
      },
      {
        init: {
          name: "Inner Radiance Save",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "1/turn",
          targetType: "creature",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              types: ["radiant", "necrotic"],
            }),
          ],
          data: {
            range: {
              value: 10,
              units: "ft",
            },
            target: {
              affects: {
                count: "1",
                type: "creature",
              },
              template: {
                contiguous: false,
                type: "radius",
                size: "10",
                units: "ft",
              },
              prompt: false,
            },
          },
        },
      },
      {
        init: {
          name: "Necrotic Shroud Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          targetType: "enemy",
          data: {
            save: {
              ability: ["cha"],
              dc: {
                calculation: "cha",
                formula: "",
              },
            },
            target: {
              affects: {
                count: "1",
                type: "enemy",
              },
              template: {
                contiguous: false,
                type: "radius",
                size: "10",
                units: "ft",
              },
              prompt: false,
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Celestial Revelation: Tracker",
        activityMatch: "Unleash Celestial Energy",
        options: {
          durationSeconds: 60,
        },
      },
      {
        name: "Inner Radiance Light",
        activityMatch: "Unleash Celestial Energy",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("12", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "token.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("pulse", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("3", 20, "token.light.animation.speed"),
        ],
      },
      {
        name: "Heavenly Wings",
        activityMatch: "Unleash Celestial Energy",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
      {
        name: "Necrotic Shroud: Frightened",
        activityMatch: "Necrotic Shroud Save",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnEndSource" as const],
      },
    ];
  }

}
