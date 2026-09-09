import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
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
        atlOnly: true,
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#ffffff"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "{\"type\": \"pulse\", \"speed\": 3,\"intensity\": 1}"),
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
          expiry: "sourceEnd",
        },
      },
    ];
  }

  // Without ATL the light is toggled by the linked macro in the description instead
  override get override(): IDDBOverrideData {
    return {
      ddbMacroDescription: !DDBEnricherData.AutoEffects.effectModules().atlInstalled,
    };
  }

  override get ddbMacroDescriptionData(): IDDBMacroDescriptionData {
    return {
      name: "innerRadiance",
      label: "Toggle Inner Radiance Light", // optional
      type: "feat",
    };
  }

}
