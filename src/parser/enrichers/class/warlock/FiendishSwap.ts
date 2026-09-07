import DDBEnricherData from "../../data/DDBEnricherData";

export default class FiendishSwap extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Divine Power: Fiendish Swap",
      targetType: "self",
      activationType: "bonus",
      data: { range: { value: "60", units: "ft" } },
    };
  }

}
