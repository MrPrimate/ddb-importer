/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class LunarVitality extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      addItemConsume: true,
      activationType: "special",
      activationCondition: "Restore HP with a spell",
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.bard.bardic-inspiration",
          types: ["healing"],
        }),
      },
    };
  }

  get override() {
    return {
      replaceActivityUses: true,
    };
  }

}
