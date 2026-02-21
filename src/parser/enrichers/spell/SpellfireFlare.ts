import DDBEnricherData from "../data/DDBEnricherData";

export default class SpellfireFlare extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 10,
              type: "radiant",
              scalingMode: "none",
            }),
          ],
        },
      },
    };
  }

}
