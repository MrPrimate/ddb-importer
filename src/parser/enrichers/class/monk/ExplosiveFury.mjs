/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ExplosiveFury extends DDBEnricherData {
  get activity() {
    return {
      targetType: "enemy",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 10,
              types: ["acid", "cold", "fire", "lightning", "poison"],
            }),
          ],
        },
      },
    };
  }

}
