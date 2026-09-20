import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * DDB names this Enchantment's actions "Flooding Abundance: Throw Candle" and "...: Fire Damage",
 * which the shared Enchantments enricher filters out by exact name, so the option imported with
 * nothing usable. Both are built from DDB here, and the 15-foot square of wax the candle leaves
 * is difficult terrain for its minute. Which 5-foot squares are burning is tracked by hand, so
 * the fire damage stays an activity the rogue uses.
 */
export default class FloodingAbundance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        action: { name: "Flooding Abundance: Throw Candle", type: "class" },
        overrides: {
          data: {
            behaviors: [DDBEnricherData.BehaviorHelper.difficultTerrain()],
          },
        },
      },
      {
        action: { name: "Flooding Abundance: Fire Damage", type: "class" },
        // DDB copies the candle's Wick Point cost onto the burn, which costs nothing
        overrides: { noConsumeTargets: true },
      },
    ];
  }

}
