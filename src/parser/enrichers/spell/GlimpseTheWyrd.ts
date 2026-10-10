import DDBEnricherData from "../data/DDBEnricherData";

/** Glimpse the Wyrd: add or subtract 1d6 from a d20 Test, rolled from the activity. */
export default class GlimpseTheWyrd extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d6",
          name: "Glimpse the Wyrd",
        },
      },
    };
  }

}
