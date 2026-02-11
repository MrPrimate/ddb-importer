/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WildSurge extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Roll for Surge",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d8",
          name: "Roll for Surge",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "1: Shadowy Tendrils (Save vs Damage)",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              value: "",
              type: "enemy",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "10",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
        overrides: {
          rangeSelf: true,
          data: {
            save: {
              ability: ["con"],
              dc: {
                calculation: "con",
                formula: "",
              },
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 12,
                  type: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "1: Shadowy Tendrils (Temporary HP)",
          type: "heal",
        },
        build: {
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 12,
            type: "temphp",
          }),
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
        },
      },
      {
        constructor: {
          name: "3: Exploding Spirit (Save vs Damage)",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              value: "",
              type: "enemy",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
        overrides: {
          rangeSelf: true,
          data: {
            save: {
              ability: ["dex"],
              dc: {
                calculation: "con",
                formula: "",
              },
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  type: ["force"],
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "4: Wild Surge Enchantment",
          type: "enchant",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          targetOverride: {
            affects: {
              type: "self",
            },
          },
          durationOverride: {
            value: "",
            units: "spec",
          },
          activationOverride: {
            type: "special",
          },
        },
        overrides: {
          data: {
            midiProperties: {
              triggeredActivityId: "none",
              triggeredActivityTargets: "targets",
              triggeredActivityRollAs: "self",
              forceDialog: false,
              confirmTargets: "never",
            },
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
      {
        constructor: {
          name: "5: Wild Magic Damage (Damage)",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              value: "1",
              type: "creature",
            },
          },
        },
        overrides: {
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  type: ["force"],
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "6: Multicolored Light (AC Bonus)",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
        },
      },
      {
        constructor: {
          name: "7: Flowers and Vines (Template)",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              value: "",
              type: "space",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "15",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
        },
      },
      {
        constructor: {
          name: "8: Bolt of Light (Save vs Damage)",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              value: "1",
              type: "enemy",
            },
          },
        },
        overrides: {
          data: {
            range: {
              value: 30,
              units: "ft",
            },
            save: {
              ability: ["con"],
              dc: {
                calculation: "con",
                formula: "",
              },
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  type: ["radiant"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Wild Surge Weapon",
        activityMatch: "4: Wild Surge Enchantment",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Wild Surge]`, 30, "name"),
          DDBEnricherData.ChangeHelper.addChange("lgt", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.addChange("thr", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 2, "system.range.value"),
          DDBEnricherData.ChangeHelper.upgradeChange("60", 2, "system.range.long"),
        ],
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
      },
      {
        name: "Multicolored Light AC Bonus",
        activityMatch: "6: Multicolored Light (AC Bonus)",
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.attributes.ac.bonus"),
        ],
        options: {
          durationSeconds: 60,
        },
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "10",
              isAura: true,
              ignoreSelf: false,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "10",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
        },
      },
      {
        name: "Bolt of Light (Blinded)",
        activityMatch: "8: Bolt of Light (Save vs Damage)",
        statuses: ["Blinded"],
        daeSpecialDurations: ["turnStartSource"],
        options: {
          durationSeconds: 6,
        },
      },
    ];
  }

}
