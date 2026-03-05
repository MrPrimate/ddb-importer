import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityPreserveLife extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.cleric.levels * 5",
          types: ["healing"],
        }),
      },
    };
  }
}
