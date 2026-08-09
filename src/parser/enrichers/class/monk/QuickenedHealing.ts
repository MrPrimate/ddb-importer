import DDBEnricherData from "../../data/DDBEnricherData";

export default class QuickenedHealing extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
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
