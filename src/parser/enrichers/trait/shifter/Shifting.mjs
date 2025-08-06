/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Shifting extends DDBEnricherData {

  // get addAutoAdditionalActivities() {
  //   return true;
  // }

  get shifterType() {
    if (!this.ddbParser._chosen || this.ddbParser._chosen.length === 0) {
      return this.ddbParser.ddbCharacter._ddbRace.fullName;
    }

    return this.ddbParser._chosen[0].label;
  }

  get type() {
    return "heal";
  }

  get activity() {
    const shifterType = this.shifterType;
    return {
      name: "Shift",
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
    };
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
      },
    ];
  }

  get additionalActivities() {
    const shifterType = this.shifterType;
    if (!shifterType) return [];
    if (shifterType === "Longtooth") return this.additionalActivitiesLongtooth;
    if (shifterType === "Swiftstride" && !this.ddbParser.ddbCharacter._ddbRace.isLegacy) return [
      {
        action: {
          name: "Swiftstride",
          type: "race",
          rename: ["Swiftstride Move Reaction"],
        },
        overrides: {
          noeffect: true,
        },
      },
    ];

    return [];
  }

  get effects() {
    const shifterType = this.shifterType;
    const changes = [];
    const midiChanges = [];
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
    return [
      {
        name: `Shifted: ${shifterType}`,
        options: {
          durationSconds: 60,
        },
        changes,
        midiChanges,
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  get override() {
    if (this.ddbParser.ddbCharacter._ddbRace.isLegacy) return {};
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "race",
          name: "Shift",
          max: "@prof",
        }),
      },
    };
  }

}
