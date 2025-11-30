/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AlchemicalSavant extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage Bonus",
          type: "damage",
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
