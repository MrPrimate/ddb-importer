/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EnhancedBond extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Bonus Healing",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: "1",
          denomination: "8",
          types: ["healing"],
        }),
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: "1",
                  denomination: "8",
                  types: ["fire"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

}


