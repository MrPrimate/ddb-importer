import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedDuplicity extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
