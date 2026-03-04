import DDBEnricherData from "../../data/DDBEnricherData";

export default class FangsOfTheFireSnake extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Extra Fire Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
        daeSpecialDurations: ["turnEndSource" as const],
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
