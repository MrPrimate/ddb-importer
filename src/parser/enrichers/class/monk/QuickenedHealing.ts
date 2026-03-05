import DDBEnricherData from "../../data/DDBEnricherData";

export default class QuickenedHealing extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.die.die + @prof",
          types: ["healing"],
        }),
      },
    };
  }
}
