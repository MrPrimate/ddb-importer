/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Shifting extends DDBEnricherData {

  get shifterType() {
    if (!this.ddbParser._chosen || this.ddbParser._chosen.length === 0) {
      return this.ddbParser.ddbCharacter._ddbRace.fullName;
    }

    return this.ddbParser._chosen[0].label;
  }

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      name: "Shifter Choice",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      id: utils.namedIDStub("shifterChoice", { prefix: "shift", postfix: "core" }),
      data: {
        enchant: {
          self: true,
        },
        duration: { units: "perm" },
      },
    };
  }

  get shiftActivities() {
    const results = [];
    for (const shifterType of ["Beasthide", "Longtooth", "Swiftstride", "Wildhunt"]) {
      results.push({
        constructor: {
          name: `Shift ${shifterType}`,
          type: "heal",
        },
        build: {
          generateHeal: true,
          generateConsumption: false,
          generateTarget: true,
        },
        overrides: {
          id: utils.namedIDStub(shifterType, { prefix: "shift", postfix: "ac" }),
          targetType: "self",
          activationType: "bonus",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: this.ddbParser.ddbCharacter._ddbRace.isLegacy
                ? "max(1, @abilities.con.mod) + @detail.level"
                : shifterType === "Beasthide"
                  ? "(2 * @prof) + 1d6"
                  : "2 * @prof",
              types: ["temphp"],
            }),
          },
        },
      });
    }
    return results;
  }

  get additionalActivitiesLongtooth() {
    return [
      {
        constructor: {
          name: "Longtooth Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "str",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "piercing",
            }),
          ],
          activationOverride: {
            type: "bonus",
            value: 1,
          },
        },
        overrides: {
          id: "ddblongtoothatta",
        },
      },
    ];
  }

  get additionalActivitiesSwiftstride() {
    return [
      {
        action: {
          name: "Swiftstride",
          type: "race",
          rename: ["Swiftstride Move Reaction"],
        },
        overrides: {
          id: "ddbswiftstridemo",
          noeffect: true,
        },
      },
    ];
  }

  get additionalActivities() {
    const results = [
      ...this.shiftActivities,
      ...this.additionalActivitiesLongtooth,
      ...this.additionalActivitiesSwiftstride,
    ];

    results.push();

    return results;
  }

  get enchantEffects() {
    const results = [];

    for (const shifterType of ["Beasthide", "Longtooth", "Swiftstride", "Wildhunt"]) {
      const effect = {
        name: `Type: ${shifterType}`,
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`Chosen: ${shifterType}`, 20, "activities[enchant].name"),
          DDBEnricherData.ChangeHelper.overrideChange("spec", true, "activities[enchant].activation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("End", true, "activities[enchant].activation.condition"),
          DDBEnricherData.ChangeHelper.overrideChange("[]", true, "activities[enchant].consumption.targets"),
        ],
        activityMatch: "Shifter Choice",
        data: {
          _id: utils.namedIDStub(shifterType, { prefix: "choice", postfix: "ef" }),
          duration: {
            "seconds": null,
            "startTime": null,
            "rounds": null,
            "turns": null,
            "startRound": null,
            "startTurn": null,
            "combat": null,
          },
          flags: {
            ddbimporter: {
              activityRiders: [utils.namedIDStub(shifterType, { prefix: "shift", postfix: "ac" })],
              effectRiders: [utils.namedIDStub(shifterType, { postfix: "ef" })],
            },
          },
        },
      };
      if (shifterType === "Longtooth") {
        effect.data.flags.ddbimporter.activityRiders.push("ddblongtoothatta");
      } else if (shifterType === "Swiftstride") {
        effect.data.flags.ddbimporter.activityRiders.push("ddbswiftstridemo");
      }
      results.push(effect);
    }
    return results;
  }

  get effects() {
    const results = [
      ...this.enchantEffects,
    ];

    for (const shifterType of ["Beasthide", "Longtooth", "Swiftstride", "Wildhunt"]) {
      const changes = [];
      if (shifterType === "Beasthide") {
        changes.push(
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.ac.bonus"),
        );
      } else if (shifterType === "Swiftstride") {
        changes.push(
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.walk"),
        );
      } else if (shifterType === "Wildhunt") {
        changes.push(
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.wis.check.roll.mode`),
        );
      }
      results.push(
        {
          name: `Shifted: ${shifterType}`,
          options: {
            durationSeconds: 60,
          },
          activityMatch: `Shift ${shifterType}`,
          changes,
          data: {
            _id: utils.namedIDStub(shifterType, { postfix: "ef" }),
            flags: {
              dae: {
                selfTarget: true,
                selfTargetAlways: true,
              },
            },
          },
        },
      );
    }
    return results;
  }

  get override() {
    const uses = this.ddbParser.ddbCharacter._ddbRace.isLegacy
      ? {}
      : this._getUsesWithSpent({
        type: "race",
        name: "Shift",
        max: "@prof",
      });

    const shifterType = this.shifterType;

    const flags = this.ddbParser.isMuncher || !shifterType
      ? {}
      : {
        transferEnchantment: {
          targetItemId: "self",
          effectId: utils.namedIDStub(shifterType, { prefix: "choice", postfix: "ef" }),
          activityId: utils.namedIDStub("shifterChoice", { prefix: "shift", postfix: "core" }),
        },
      };

    return {
      data: {
        "name": "Shifting",
        "system.uses": uses,
        "flags.ddbimporter": flags,
      },
    };
  }

}
