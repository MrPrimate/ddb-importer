import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Poundwise Porter: for 1 minute after drinking it, +3 to attack and damage rolls with Unarmed
 * Strikes. The drink applies a self effect with unarmed-only roll bonuses (the Demon Armor idiom),
 * so it follows whichever Unarmed Strike the character rolls.
 */
export default class PoundwisePorter extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poundwise Porter",
        activityMatch: "Drink",
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("attack", "3", {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "3", {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
        ],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "+3 to attack and damage rolls with your Unarmed Strikes.",
        },
      },
    ];
  }

}
