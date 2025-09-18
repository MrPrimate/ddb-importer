/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FangsOfTheFireSnake extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      name: "Enchant Weapon",
      id: "ddbFireDamage123",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Extra Fire Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateTarget: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 12,
              types: ["fire"],
            }),
          ],
        },
      },
    ];
  }

  get effects() {
    return [
      {
        type: "enchant",
        activityMatch: "Enchant Weapon",
        name: `Fangs of the Fire Snake`,
        options: {
          description: `This weapon is infused with elemental energy.`,
          durationTurns: 1,
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnEndSource"],
        data: {
          flags: {
            ddbimporter: {
              activityRiders: ["ddbFireDamage123"],
            },
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("10", 20, "system.range.reach"),
          DDBEnricherData.ChangeHelper.addChange("fire", 20, "system.damage.base.types"),
        ],
      },
    ];
  }

}
