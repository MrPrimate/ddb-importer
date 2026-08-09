import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedDuplicity extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
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
