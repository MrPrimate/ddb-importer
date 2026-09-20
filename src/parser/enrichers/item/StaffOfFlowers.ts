import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";
import { lastChargeCheck } from "./_LastChargeCheck";

export default class StaffOfFlowers extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return { noConsumeTargets: true };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "10", [{ period: "dawn", type: "formula", formula: "1d6 + 4" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Create Flower", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        addItemConsume: true,
        noTemplate: true,
        rangeType: "ft",
        rangeValue: 5,
        overrideRange: true,
        targetType: "space",
      }),
      lastChargeCheck(),
    ];
  }

}
