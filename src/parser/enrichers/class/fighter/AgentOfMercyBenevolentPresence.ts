import DDBEnricherData from "../../data/DDBEnricherData";

/** Couatl Herald Benevolent Presence: spend Mercy Dice and add them to an Insight, Performance or Persuasion check. */
export default class AgentOfMercyBenevolentPresence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You make a Wisdom (Insight) or Charisma (Performance or Persuasion) check",
      addItemConsume: true,
      itemConsumeTargetName: "agent-of-mercy",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        consumption: { scaling: { allowed: true, max: "@item.uses.value" } },
        roll: { prompt: false, visible: true, formula: "(@scaling)d@scale.couatl-herald.agent-of-mercy.faces", name: "Check Bonus" },
      },
    };
  }

}
