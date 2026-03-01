import DDBEnricherData from "../../data/DDBEnricherData";

export default class CauterizingFlames extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      name: "Bonus Healing",
      activationType: "reaction",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 10,
          bonus: "@abilities.wis.mod",
          types: ["healing"],
        }),
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
                  number: 2,
                  denomination: 10,
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


