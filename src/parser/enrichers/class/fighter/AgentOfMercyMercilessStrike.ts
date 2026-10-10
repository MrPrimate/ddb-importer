import DDBEnricherData from "../../data/DDBEnricherData";

/** Couatl Herald Merciless Strike: once per turn, a weapon or Unarmed Strike hit spends a Mercy Die for that much Radiant damage. */
export default class AgentOfMercyMercilessStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once on each of your turns, you hit a creature with a weapon or Unarmed Strike attack roll",
      addItemConsume: true,
      itemConsumeTargetName: "agent-of-mercy",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.couatl-herald.agent-of-mercy", types: ["radiant"] })],
        },
      },
    };
  }

}
