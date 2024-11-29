/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ImprovedDuplicity extends DDBEnricherData {
  get type() {
    return "Improved Duplicity";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.cleric.levels",
          types: ["healing"],
        }),
      },
    };
  }
}
