/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmorModel extends DDBEnricherData {

  get type() {
    return "none";
  }

  get _guardianActivities() {
    const defensiveFieldUses = this._getUsesWithSpent({
      type: "class",
      name: "Defensive Field",
      max: "@prof",
      period: "lr",
    });
    const results = [
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
                  customFormula: this.is2014 ? null : "@scale.armorer.thunder-pulse + max(@abilities.str.mod, @abilities.int.mod) + @scale.armorer.improved-armorer",
                  number: this.is2014 ? 1 : null,
                  denomination: this.is2014 ? 8 : null,
                  bonus: this.is2014 ? "max(@abilities.str.mod, @abilities.int.mod)" : null,
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

    return results;
  }

  get _infiltratorActivities() {
    const results = [
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
                  customFormula: this.is2014 ? null : "@scale.armorer.lightning-launcher + max(@abilities.str.mod, @abilities.int.mod) + @scale.armorer.improved-armorer",
                  number: this.is2014 ? 1 : null,
                  denomination: this.is2014 ? 6 : null,
                  bonus: this.is2014 ? "max(@abilities.str.mod, @abilities.int.mod)" : null,
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
                  customFormula: this.is2014 ? null : "@scale.armorer.lightning-launcher",
                  number: this.is2014 ? 1 : null,
                  denomination: this.is2014 ? 6 : null,
                  type: "lightning",
                }),
              ],
            },
          },
        },
      },
    ];

    return results;
  }

  get _dreadnaughtActivities() {
    const results = [
      {
        constructor: {
          name: "Dreadnaught",
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
        action: { name: "Force Demolisher", type: "class" },
        overrides: {
          id: "ddbForceDemolish",
          targetType: "creature",
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.dex.mod, @abilities.int.mod)",
              type: {
                value: "melee",
              },
            },
            img: "icons/weapons/hammers/hammer-double-glowing-yellow.webp",
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@scale.armorer.force-demolisher + max(@abilities.str.mod, @abilities.int.mod) + @scale.armorer.improved-armorer",
                  type: "force",
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "Giant Statue (Large)",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "bonus",
          },
          targetOverride: {
            affects: {
              type: "object",
            },
          },
        },
        overrides: {
          id: "ddbGiantStatue00",
          targetType: "self",
          data: {
            midiProperties: {
              triggeredActivityId: "none",
              triggeredActivityTargets: "targets",
              triggeredActivityRollAs: "self",
              forceDialog: false,
              confirmTargets: "never",
            },
            duration: {
              units: "seconds",
              value: "60",
            },
            effects: [
              {
                "_id": "ddbGiantStatue03",
                riders: {
                  activity: [],
                  effect: [],
                },
              },
            ],
          },
        },
      },
      {
        constructor: {
          name: "Giant Statue (Huge)",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "bonus",
          },
          targetOverride: {
            affects: {
              type: "object",
            },
          },
        },
        overrides: {
          id: "ddbGiantStatue01",
          targetType: "self",
          data: {
            midiProperties: {
              triggeredActivityId: "none",
              triggeredActivityTargets: "targets",
              triggeredActivityRollAs: "self",
              forceDialog: false,
              confirmTargets: "never",
            },
            duration: {
              units: "seconds",
              value: "60",
            },
            visibility: {
              "level": {
                "min": 15,
                "max": null,
              },
              "requireAttunement": false,
              "requireIdentification": false,
              "requireMagic": false,
              "identifier": "artificer",
            },
            effects: [
              {
                "_id": "ddbGiantStatue04",
                "level": {
                  "min": 15,
                  "max": null,
                },
                riders: {
                  activity: [],
                  effect: [],
                },
              },
            ],
          },
        },
      },
    ];

    return results;
  }

  get additionalActivities() {

    const results = [
      ...this._guardianActivities,
      ...this._infiltratorActivities,
    ];

    if (this.is2024) {
      results.push(...this._dreadnaughtActivities);
    }

    return results;
  }

  get _guardianEffects() {
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
    ];
  }

  get _infiltratorEffects() {
    return [
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
              "damage.all": this.is2014 ? "1d6[lightning]" : "@scale.armorer.lightning-launcher[lightning]",
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
            ddbimporter: {
              activityRiders: ["ddbInfiltratLigh", "ddbLightingExtra"],
              effectRiders: ["ddbInfiltratorEf"],
            },
          },
        },
      },
    ];
  }

  get _dreadnaughtEffects() {
    return [
      {
        name: "Dreadnaught",
        activityMatch: "Dreadnaught",
        type: "enchant",
        descriptionHint: true,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Dreadnaught]`, 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "system.strength"),
          DDBEnricherData.ChangeHelper.addChange("foc", 20, "system.properties"),
        ],
        data: {
          flags: {
            ddbimporter: {
              activityRiders: ["ddbForceDemolish", "ddbGiantStatue00", "ddbGiantStatue01"],
              // effectRiders: ["ddbGiantStatue03", "ddbGiantStatue04"],
            },
          },
          duration: {
            seconds: null,
            rounds: null,
          },
        },
      },
      {
        name: "Giant Stature (Large)",
        activityMatch: "Giant Stature (Large)",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 20, "system.traits.size"),
          // DDBEnricherData.ChangeHelper.addChange("", 20, "system.range"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(2, 10, "ATL.width"),
          DDBEnricherData.ChangeHelper.upgradeChange(2, 10, "ATL.height"),
        ],
        data: {
          _id: "ddbGiantStatue03",
          duration: {
            seconds: 60,
            rounds: 10,
          },
        },
      },
      {
        name: "Giant Stature (Huge)",
        activityMatch: "Giant Stature (Huge)",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("hg", 20, "system.traits.size"),
          // DDBEnricherData.ChangeHelper.addChange("", 20, "system.range"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(3, 15, "ATL.width"),
          DDBEnricherData.ChangeHelper.upgradeChange(3, 15, "ATL.height"),
        ],
        data: {
          _id: "ddbGiantStatue04",
          duration: {
            seconds: 60,
            rounds: 10,
          },
        },
      },
    ];
  }

  get effects() {
    const results = [
      ...this._guardianEffects,
      ...this._infiltratorEffects,
    ];

    if (this.is2024) {
      results.push(...this._dreadnaughtEffects);
    }

    return results;

  }

}
