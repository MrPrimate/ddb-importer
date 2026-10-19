import DDBEnricherData from "../../data/DDBEnricherData";

export default class AlchemicalSavant extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Restore Hit Points Bonus",
      activationType: "special",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          // "equal to your Intelligence modifier (minimum of +1)"
          bonus: "max(1, @abilities.int.mod)",
          types: ["healing"],
        }),

      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
                  // "equal to your Intelligence modifier (minimum of +1)"
                  bonus: "max(1, @abilities.int.mod)",
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
