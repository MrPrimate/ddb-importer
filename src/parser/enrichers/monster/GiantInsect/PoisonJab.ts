import DDBEnricherData from "../../data/DDBEnricherData";

export default class PoisonJab extends DDBEnricherData {

  get activity(): IDDBActivityData {
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
