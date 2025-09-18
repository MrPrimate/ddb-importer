/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FistOfUnbrokenAir extends DDBEnricherData {

  get activity() {
    return {
      addScalingMode: "amount",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@scaling +2)d10",
              type: "bludgeoning",
            }),
          ],
        },
      },
    };
  }

}
