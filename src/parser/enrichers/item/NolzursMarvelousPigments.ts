import DDBEnricherData from "../data/DDBEnricherData";
import { quantityUses, determineQuantity } from "./_ItemQuantity";

export default class NolzursMarvelousPigments extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Paint",
      activationType: "minute",
      activationValue: 10,
      addItemConsume: true,
      activationCondition: this.is2014
        ? "Each use paints 100 square feet in 10 minutes. A pot contains ten uses; track the 10,000 cubic foot volume limit per pot manually."
        : "Remain inside the cube and concentrate while painting; create objects and terrain manually",
      rangeSelf: true,
      overrideTarget: true,
      data: {
        duration: { value: "10", units: "minute", concentration: !this.is2014 },
        target: {
          affects: { type: "space", count: "" },
          template: { type: this.is2014 ? "square" : "cube", size: this.is2014 ? "10" : "20", units: "ft" },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return quantityUses(this, this.is2014 ? 40 : 4);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [determineQuantity("Determine Pots", this.is2014 ? "10 * 1d4" : "1d4")];
  }

}
