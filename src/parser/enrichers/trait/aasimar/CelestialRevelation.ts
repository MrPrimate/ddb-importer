import DDBEnricherData from "../../data/DDBEnricherData";
import RegionBehaviorSettings from "../../../../lib/RegionBehaviorSettings";
import { emanation, regionPlacer } from "../../data/RegionBuilders";

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
    // with region automation the damage is rolled by an aura that follows the token, so the
    // damage activity itself places nothing
    const automated = RegionBehaviorSettings.add;
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
          noTemplate: automated,
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
            target: automated
              ? { override: true, affects: { type: "creature", count: "" } }
              : emanation("10"),
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
    if (automated) {
      activities.push(regionPlacer("Inner Radiance Aura", {
        template: { type: "radius", size: "10" },
        activationType: "special",
        activationCondition: "When you choose Inner Radiance",
        duration: { value: "1", units: "minute" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            ownerTurn: true,
            events: ["tokenTurnEnd"],
            activityName: "Inner Radiance Damage",
            excludeSelf: true,
          }),
        ],
      }));
    }
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
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "token.light.dim"),
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
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
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
