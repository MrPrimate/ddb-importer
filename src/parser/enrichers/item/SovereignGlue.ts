import DDBEnricherData from "../data/DDBEnricherData";
import { quantityUses, determineQuantity } from "./_ItemQuantity";

export default class SovereignGlue extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Apply Glue",
      activationType: this.is2014 ? "special" : "action",
      addItemConsume: true,
      activationCondition: "Each ounce covers one square foot; the glue takes 1 minute to set",
      addScalingMode: "amount",
      addConsumptionScalingMax: "@item.uses.value",
      rangeType: "touch",
      overrideRange: true,
      overrideTarget: true,
      data: {
        target: {
          affects: { type: "object", count: "" },
          template: { type: "square", size: "sqrt(@scaling)", units: "ft" },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return quantityUses(this, 7);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [determineQuantity("Determine Ounces", "1d6 + 1")];
  }

}
