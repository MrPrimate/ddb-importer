import DDBEnricherData from "../../data/DDBEnricherData";

/** Bright Gallus: an action inspires an ally, who adds a d4 to their next ability check, attack roll or saving throw. */
export default class Inspiring extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Inspiring",
      targetType: "ally",
      targetCount: 1,
      activationType: "action",
      data: {
        roll: { prompt: false, visible: true, formula: "1d4", name: "Inspiration Die" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Inspired",
        options: {
          description: "Roll a d4 and add it to your next ability check, attack roll, or saving throw.",
        },
      },
    ];
  }

}
