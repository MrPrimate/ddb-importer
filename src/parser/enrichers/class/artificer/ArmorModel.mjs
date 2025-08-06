/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmorModel extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    const defensiveFieldUses = this._getUsesWithSpent({
      type: "class",
      name: "Defensive Field",
      max: "@prof",
      period: "lr",
    });
    return [
      {
        constructor: {
          name: "Guardian",
          type: "enchant",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "object",
            },
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
              type: "equipment",
              categories: ["heavy", "light", "medium"],
              allowMagical: true,
            },
          },
        },
      },
      {
        constructor: {
          name: "Infiltrator",
          type: "enchant",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "object",
            },
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
              type: "equipment",
              categories: ["heavy", "light", "medium"],
              allowMagical: true,
            },
          },
        },
      },
      {
        constructor: {
          name: "Infiltrator: Lightning Launcher",
          type: "attack",
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          activationOverride: {
            type: "attack",
          },
        },
        overrides: {
          id: "ddbInfiltratLigh",
          targetType: "creature",
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.dex.mod, @abilities.int.mod)",
              type: {
                value: "ranged",
              },
            },
            img: "icons/magic/lightning/projectile-orb-blue.webp",
            range: {
              value: 90,
              long: 600,
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  bonus: "max(@abilities.str.mod, @abilities.int.mod)",
                  type: "lightning",
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "Infiltrator: Lightning Launcher (Extra Damage)",
          type: "attack",
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
        },
        overrides: {
          id: "ddbLightingExtra",
          targetType: "creature",
          activationCondition: "Once per turn",
          data: {
            img: "icons/magic/lightning/projectile-orb-blue.webp",
            range: {
              value: 90,
              long: 600,
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  type: "lightning",
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "Guardian: Thunder Gauntlet",
          type: "attack",
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          activationOverride: {
            type: "attack",
          },
        },
        overrides: {
          id: "ddbThunderGauntl",
          targetType: "creature",
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.str.mod, @abilities.int.mod)",
            },
            img: "icons/magic/lightning/bolt-forked-large-blue.webp",
            range: {
              value: 5,
              long: null,
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 8,
                  bonus: "max(@abilities.str.mod, @abilities.int.mod)",
                  type: "thunder",
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "Guardian: Defensive Field",
          type: "heal",
        },
        build: {
          generateTarget: true,
          generateConsumption: true,
        },
        overrides: {
          id: "ddbDefensivField",
          targetType: "self",
          addActivityConsume: true,
          data: {
            img: "icons/magic/control/debuff-chains-ropes-net-white.webp",
            healing: DDBEnricherData.basicDamagePart({
              bonus: "@classes.artificer.levels",
              types: ["temphp"],
            }),
            uses: defensiveFieldUses,
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Guardian",
        activityMatch: "Guardian",
        type: "enchant",
        descriptionHint: true,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Guardian]`, 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "system.strength"),
          DDBEnricherData.ChangeHelper.addChange("foc", 20, "system.properties"),
        ],
        data: {
          flags: {
            dae: {
              specialDuration: "",
            },
            ddbimporter: {
              activityRiders: ["ddbThunderGauntl", "ddbDefensivField"],
            },
          },
          duration: {
            seconds: null,
            rounds: null,
          },
        },
      },
      {
        name: "Thunder Struck",
        activityMatch: "Guardian: Thunder Gauntlet",
        options: {
          durationSeconds: 6,
          description: `Disadvantage on attack rolls against targets other than you until the start of your next turn`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("!workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        daeSpecialDurations: ["turnStartSource"],
        data: {
          img: "icons/skills/melee/unarmed-punch-fist-white.webp",
          duration: {
            seconds: 6,
          },
        },
      },
      {
        name: "Infiltrator Armor",
        activityMatch: "None",
        options: {
          // disabled: true,
          transfer: true,
          description: `You have advantage on Dexterity (Stealth) checks`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("5", 20, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.stl.roll.mode"),
        ],
        midiOptionalChanges: [
          {
            name: "lightningLauncher",
            data: {
              label: "Use Lightning Launcher extra damage?",
              count: "turn",
              "damage.all": "1d6[lightning]",
              activation: `"@workflow.activity.name" == "Infiltrator: Lightning Launcher"`,
            },
          },
        ],
        data: {
          _id: "ddbInfiltratorEf",
          duration: {
            seconds: null,
            rounds: null,
          },
          flags: {
            dae: {
              specialDuration: "",
            },
          },
        },
      },
      {
        name: "Infiltrator",
        activityMatch: "Infiltrator",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Infiltrator]`, 30, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "system.strength"),
          DDBEnricherData.ChangeHelper.addChange("foc", 20, "system.properties"),
        ],
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
          flags: {
            dae: {
              specialDuration: "",
            },
            ddbimporter: {
              activityRiders: ["ddbInfiltratLigh", "ddbLightingExtra"],
              effectRiders: ["ddbInfiltratorEf"],
            },
          },
        },
      },
    ];
  }

}
