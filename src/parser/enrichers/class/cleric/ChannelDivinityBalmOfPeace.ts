import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityBalmOfPeace extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      name: "Healing Roll",
      targetType: "ally",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 6,
          bonus: "@abilities.wis.mod",
          types: ["healing"],
        }),
      },
    };
  }
}
