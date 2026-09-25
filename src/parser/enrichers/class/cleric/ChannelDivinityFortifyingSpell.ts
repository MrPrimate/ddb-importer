import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityFortifyingSpell extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you cast a spell",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 8,
          bonus: "@classes.cleric.levels",
          types: ["temphp"],
        }),
        range: { units: "spec" },
      },
    };
  }

}
