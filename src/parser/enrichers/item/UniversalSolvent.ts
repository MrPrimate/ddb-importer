import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { quantityUses, determineQuantity } from "./_ItemQuantity";

export default class UniversalSolvent extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Apply Solvent",
      activationType: "action",
      addItemConsume: true,
      activationCondition: this.is2014
        ? "Empty the tube over up to one square foot"
        : "Each ounce dissolves one square foot; template shows the equivalent square area",
      ...(!this.is2014 ? { addScalingMode: "amount", addConsumptionScalingMax: "@item.uses.value" } : {}),
      rangeType: "touch",
      overrideRange: true,
      overrideTarget: true,
      data: {
        target: {
          affects: { type: "object", count: "" },
          template: { type: "square", size: this.is2014 ? "1" : "sqrt(@scaling)", units: "ft" },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return this.is2014 ? itemUses(this, "1") : quantityUses(this, 7);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014 ? [] : [determineQuantity("Determine Ounces", "1d6 + 1")];
  }

}
