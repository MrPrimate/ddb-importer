import DDBEnricherData from "../../data/DDBEnricherData";

export default class QuickenedHealing extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      type: "heal",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.die.die + @prof",
          types: ["healing"],
        }),
      },
    };
  }
}
