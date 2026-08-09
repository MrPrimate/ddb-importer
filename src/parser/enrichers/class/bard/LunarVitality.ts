import DDBEnricherData from "../../data/DDBEnricherData";

export default class LunarVitality extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
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
