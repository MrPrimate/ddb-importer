/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

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
