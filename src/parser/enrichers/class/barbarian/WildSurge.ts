import DDBEnricherData from "../../data/DDBEnricherData";

export default class WildSurge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "1: Shadowy Tendrils (Save vs Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
              count: "",
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
                  types: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "1: Shadowy Tendrils (Temporary HP)",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
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
        init: {
          name: "3: Exploding Spirit (Save vs Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
              count: "",
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
                  types: ["force"],
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "4: Wild Surge Enchantment",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
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
        init: {
          name: "5: Wild Magic Damage (Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
              count: "1",
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
                  types: ["force"],
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "6: Multicolored Light (AC Bonus)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
          targetType: "ally",
          rangeSelf: true,
          data: {
            target: {
              template: {
                contiguous: false,
                type: "radius",
                size: "10",
                units: "ft",
              },
            },
            behaviors: [
              DDBEnricherData.BehaviorHelper.applyEffect({
                effects: "Multicolored Light AC Bonus",
                auraeffectsNever: true,
              }),
            ],
          },
        },
      },
      {
        init: {
          name: "7: Flowers and Vines (Template)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
              count: "",
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
        init: {
          name: "8: Bolt of Light (Save vs Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
              count: "1",
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
                  types: ["radiant"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
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
            value: null,
            expiry: null,
            expired: null,
          },
        },
      },
      {
        name: "Multicolored Light AC Bonus",
        standalone: true,
        auraeffectsNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.attributes.ac.bonus"),
        ],
        options: {
          durationSeconds: 60,
        },
      },
      {
        name: "Multicolored Light AC Bonus",
        activityMatch: "6: Multicolored Light (AC Bonus)",
        auraeffectsOnly: true,
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.attributes.ac.bonus"),
        ],
        options: {
          durationSeconds: 60,
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
        options: {
          expiry: "sourceStart",
        },
      },
    ];
  }

}
