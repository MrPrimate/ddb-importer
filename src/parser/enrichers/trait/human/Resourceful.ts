import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Resourceful (Human, 2024): Heroic Inspiration after every long rest. The activity is the
 * long-rest reminder; inspiration itself is a sheet toggle.
 */
export default class Resourceful extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Gain Heroic Inspiration",
      activationType: "longRest",
      targetType: "self",
      rangeSelf: true,
    };
  }

}
