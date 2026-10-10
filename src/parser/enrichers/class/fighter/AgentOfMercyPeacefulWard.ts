import DDBEnricherData from "../../data/DDBEnricherData";

/** Couatl Herald Peaceful Ward: a Bonus Action spends a Mercy Die for Temporary Hit Points of its roll plus Charisma modifier (minimum 1). */
export default class AgentOfMercyPeacefulWard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "agent-of-mercy",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "max(1, @scale.couatl-herald.agent-of-mercy + @abilities.cha.mod)",
          types: ["temphp"],
        }),
      },
    };
  }

}
