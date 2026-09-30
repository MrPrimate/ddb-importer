import DDBEnricherData from "../data/DDBEnricherData";
import { setItemCastUses } from "./_ItemActivities";

/**
 * AU rod. Druidcraft is at will; Plant Growth (Overgrowth only) and Insect Plague are each once per
 * dawn on their own cast. The primary activity is the Magic action that keeps plants in a 5-foot
 * Cube verdant for 1d4 days.
 */
export default class FloweringBlossomRod extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Rejuvenate Plants",
      activationType: "action",
      noConsumeTargets: true,
      data: {
        range: { override: true, units: "ft", value: "15" },
        target: {
          override: true,
          template: { count: "1", contiguous: false, type: "cube", size: "5", width: "", height: "", units: "ft" },
          affects: { count: "", type: "", choice: false, special: "Nonmagical plants" },
        },
        roll: { formula: "1d4", prompt: false, visible: true, name: "Days Verdant" },
      },
    };
  }

  override async cleanup(): Promise<void> {
    setItemCastUses(this.data, { limited: ["Plant Growth", "Insect Plague"], unlimited: ["Druidcraft"] });
  }

}
