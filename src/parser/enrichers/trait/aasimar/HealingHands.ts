import DDBEnricherData from "../../data/DDBEnricherData";

export default class HealingHands extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        // "range.units": "touch",
        healing: DDBEnricherData.basicDamagePart({ customFormula: "(@prof)d4", types: ["healing"] }),
      },
    };
  }

}
