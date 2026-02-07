/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ProtectiveSpirit extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "turnEnd",
      condition: "Reduced to half HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1d6 + (@classes.paladin.levels / 2)",
          types: ["healing"],
        }),
      },
    };
  }

}
