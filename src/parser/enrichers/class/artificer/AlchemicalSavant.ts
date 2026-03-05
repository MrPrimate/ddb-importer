import DDBEnricherData from "../../data/DDBEnricherData";

export default class AlchemicalSavant extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Restore Hit Points Bonus",
      activationType: "special",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "@abilities.int.mod",
          types: ["healing"],
        }),

      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage Bonus",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateRange: false,
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  bonus: "@abilities.int.mod",
                  types: ["fire", "acid", "poison"],
                }),
              ],
            },
          },
        },
      },
    ];
  }
}
