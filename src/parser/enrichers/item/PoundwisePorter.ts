import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Poundwise Porter: for 1 minute after drinking it, +3 to attack and damage rolls with Unarmed
 * Strikes. The drink applies a self effect with AC5e roll bonuses scoped to Unarmed Strikes; dnd5e
 * 5.x has no bonus limited to them, so without AC5e the drink applies nothing.
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

  // only AC5e can scope the bonus to Unarmed Strikes, so there is no plain fallback (a melee weapon
  // bonus would reach every weapon)
  override get effects(): IDDBEffectHint[] {
    const helper = DDBEnricherData.ChangeHelper;
    return [
      {
        name: "Poundwise Porter",
        activityMatch: "Drink",
        ac5eOnly: true,
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "+3 to attack and damage rolls with your Unarmed Strikes.",
        },
        ac5eChanges: [
          helper.ac5eChange("bonus=3; item.name.includes('Unarmed')", 20, "flags.automated-conditions-5e.attack.bonus"),
          helper.ac5eChange("bonus=3; item.name.includes('Unarmed')", 20, "flags.automated-conditions-5e.damage.bonus"),
        ],
      },
    ];
  }

}
