import DDBEnricherData from "../../data/DDBEnricherData";
import { emanation } from "../../data/AreaBuilders";

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
      noTemplate: true,
      data: {
        range: {
          override: true,
          value: null,
          units: "self",
        },
        midiProperties: { chooseEffects: true },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
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
          name: "Inner Radiance Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          noConsumeTargets: true,
          activationType: "turnEnd",
          activationCondition: "At the end of each of your turns, each creature within 10 feet of you",
          targetType: "creature",
          removeDamageParts: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              type: "radiant",
            }),
          ],
          data: {
            range: {
              override: true,
              value: null,
              units: "self",
            },
            target: emanation("10"),
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
    return activities;
  }

  // the parsed Frightened duplicates Necrotic Shroud's and would link to every activity
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Celestial Revelation",
        activityMatch: "Unleash Celestial Energy",
        options: {
          durationSeconds: 60,
          description: "Once on each of your turns, deal extra Necrotic or Radiant damage equal to your Proficiency Bonus to one target you damage with an attack or a spell.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@prof[necrotic, radiant]; oncePerTurn; optin",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
        midiOptionalChanges: [
          {
            name: "celestialRevelation",
            data: {
              label: "Celestial Revelation Bonus Damage",
              count: "each-round",
              "damage.all": "@prof",
            },
          },
        ],
      },
      {
        name: "Inner Radiance Light",
        activityMatch: "Unleash Celestial Energy",
        options: {
          durationSeconds: 60,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "ATL.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "ATL.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "ATL.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("pulse", 20, "ATL.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("3", 20, "ATL.light.animation.speed"),
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

}
