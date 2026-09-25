import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dynamite Stick: the 5-foot sphere burst the parser leaves off the save.
 */
export default class DynamiteStick extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      data: { target: { template: { type: "sphere", size: "5", units: "ft", count: "" } } },
    };
  }

}
