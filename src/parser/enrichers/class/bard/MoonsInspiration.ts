import DDBEnricherData from "../../data/DDBEnricherData";
import Generic from "../Generic";

/**
 * College of the Moon. Lunar Vitality spends a Bardic Inspiration die (named, so the
 * replaceActivityUses linking resolves it). Inspired Eclipse rides on the Bonus Action that gives
 * Bardic Inspiration, so it spends nothing itself.
 */
export default class MoonsInspiration extends Generic {

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Lunar Vitality", type: "class" } },
      {
        action: { name: "Inspired Eclipse", type: "class" },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
