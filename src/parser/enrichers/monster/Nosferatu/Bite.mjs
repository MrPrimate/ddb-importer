/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Bite extends DDBEnricherData {

  get type() {
    return "attack";
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
