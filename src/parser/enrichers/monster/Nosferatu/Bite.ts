import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bite extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity() {
    return {
      name: "Bite (Full Hit Points)",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Bite (Missing Hit Points)",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 10,
                  types: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
