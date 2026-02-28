import DDBEnricherData from "../../data/DDBEnricherData";

export default class LunarVitality extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
          customFormula: "@scale.bard.inspiration",
          types: ["healing"],
        }),
      },
    };
  }

}
