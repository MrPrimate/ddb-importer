import DDBEnricherData from "../../data/DDBEnricherData";

export default class HealingHands extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        // "range.units": "touch",
        healing: DDBEnricherData.basicDamagePart({ customFormula: "(@prof)d4", types: ["healing"] }),
      },
    };
  }

}
