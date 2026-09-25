import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { lastChargeCheck } from "./_LastChargeCheck";

export default class WandOfPyrotechnics extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Burst of Light",
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      rangeType: "ft",
      rangeValue: this.is2014 ? 60 : 120,
      overrideRange: true,
      targetType: "space",
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "7", [{ period: "dawn", type: "formula", formula: "1d6 + 1" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [lastChargeCheck()];
  }

}
