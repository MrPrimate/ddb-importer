/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FormOfTheBeast extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Transform",
      activationType: "bonus",
      targetType: "self",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "min(20, @classes.warlock.levels*2)",
          types: ["temphp"],
        }),
      },
    };
  }

  get effects() {
    return [{
      name: "Form of the Beast",
      activityMatch: "Transform",
      options: {
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.prc.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.ste.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.sur.roll.mode"),
      ],
    }];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bite",
          type: "attack",
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "action",
          },
        },
        overrides: {
          targetType: "creature",
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
              type: {
                value: "ranged",
              },
            },
            range: {
              value: "5",
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
                  type: "piercing",
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "Claw",
          type: "attack",
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "bonus",
          },
        },
        overrides: {
          targetType: "creature",
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
              type: {
                value: "ranged",
              },
            },
            range: {
              value: "5",
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 4,
                  bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
                  type: "slashing",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "class",
          name: "Form of the Beast",
          max: "2",
          period: "sr",
        }),
      },
    };
  }

}
