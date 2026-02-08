/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UnearthlyRecovery extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Healing",
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "floor(@attributes.hp.max / 2)",
          types: ["healing"],
        }),
      },
    };
  }

}


