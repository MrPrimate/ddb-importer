import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { lastChargeCheck } from "./_LastChargeCheck";

export default class WandOfConducting extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Conduct Music",
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      rangeType: "ft",
      rangeValue: this.is2014 ? 60 : 120,
      overrideRange: true,
      targetType: "self",
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "recoverAll" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [lastChargeCheck()];
  }

}
