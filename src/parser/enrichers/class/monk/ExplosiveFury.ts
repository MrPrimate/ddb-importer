import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExplosiveFury extends DDBEnricherData {
  get activity(): IDDBActivityData {
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
