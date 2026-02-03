/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CauterizingFlames extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Bonus Healing",
      activationType: "reaction",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: "2",
          denomination: "10",
          bonus: "@abilities.wis.mod",
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
            type: "reaction",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: "2",
                  denomination: "10",
                  bonus: "@abilities.wis.mod",
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


