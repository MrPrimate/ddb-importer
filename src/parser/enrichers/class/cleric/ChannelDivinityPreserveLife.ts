import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityPreserveLife extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      // "As a Magic action ... Choose Bloodied creatures within 30 feet of yourself (which can include you)"
      activationType: "action",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.cleric.levels * 5",
          types: ["healing"],
        }),
        range: { value: null, units: "self" },
        target: {
          template: { size: "30", units: "ft", type: "radius" },
        },
      },
    };
  }
}
