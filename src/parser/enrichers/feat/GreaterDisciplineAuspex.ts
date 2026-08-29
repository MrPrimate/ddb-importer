import DDBEnricherData from "../data/DDBEnricherData";

export default class GreaterDisciplineAuspex extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Auspex: Heightened Awareness",
        options: {
          durationSeconds: 60,
          description: "You have Advantage on Intelligence and Wisdom checks and saving throws.",
        },
        changes: [
          // Two rule changes gated on the ability being rolled
          ...(["check", "save"] as const).map((category) =>
            DDBEnricherData.ChangeHelper.ruleAdvantageChange(category, {
              conditions: { k: "roll.ability", o: "in", v: ["int", "wis"] },
            })),
        ],
      },
    ];
  }

}
