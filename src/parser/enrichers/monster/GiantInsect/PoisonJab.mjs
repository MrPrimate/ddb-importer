/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PoisonJab extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "piercing",
            }),
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 4,
              type: "poison",
            }),
          ],
        },
      },
    };
  }

}
