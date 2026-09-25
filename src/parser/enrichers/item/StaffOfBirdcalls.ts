import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";
import { lastChargeCheck } from "./_LastChargeCheck";

export default class StaffOfBirdcalls extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return { noConsumeTargets: true };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "10", [{ period: "dawn", type: "formula", formula: "1d6 + 4" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Create Sound", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        addItemConsume: true,
        noTemplate: true,
        rangeType: "ft",
        rangeValue: this.is2014 ? 60 : 120,
        overrideRange: true,
        targetType: "self",
      }),
      lastChargeCheck(),
    ];
  }

}
