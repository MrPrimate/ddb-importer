/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ShiftingLongtooth extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@prof * 2",
          types: ["temphp"],
        }),
      },
    };
  }

  get additionalActivities() {
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

  get override() {
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
