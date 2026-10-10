import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Couatl Herald Paragon: a Bonus Action command spends a Mercy Die; a creature within 30 feet that
 * hears it gains Temporary Hit Points of the roll plus your Charisma modifier (minimum 1) and can use
 * its Reaction to move half its Speed and attack, knocking out instead of killing.
 */
export default class ParagonCommand extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "agent-of-mercy",
      data: {
        range: { override: true, value: "30", units: "ft" },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "max(1, @scale.couatl-herald.agent-of-mercy + @abilities.cha.mod)",
          types: ["temphp"],
        }),
      },
    };
  }

}
