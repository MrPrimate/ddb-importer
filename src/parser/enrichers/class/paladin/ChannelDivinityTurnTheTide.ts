import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityTurnTheTide extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      activationCondition: "Reduced to half HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 6,
          bonus: "max(@abilities.cha.mod, 1)",
          types: ["healing"],
        }),
      },
    };
  }

}
