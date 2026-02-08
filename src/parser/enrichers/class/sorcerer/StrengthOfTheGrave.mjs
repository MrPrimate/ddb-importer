/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StrengthOfTheGrave extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      noConsumeTargets: true,
      targetType: "self",
      noeffect: true,
      activationType: "special",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        consumption: {
          "targets": [],
          "scaling": {
            "allowed": true,
            "max": "",
          },
          "spellSlot": true,
        },
        save: {
          ability: ["cha"],
          dc: {
            calculation: "",
            formula: "5 + @scaling",
          },
        },
      },
    };
  }

}
