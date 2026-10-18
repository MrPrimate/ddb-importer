import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * "Once you use the horn, it can't be used again until 7 days have passed": seven uses regaining
 * one a day, all spent by a blow, as the official data models it.
 */
export default class HornOfValhalla extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      itemConsumeValue: "@item.uses.max",
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "7", [{ period: "day", type: "formula", formula: "1" }]);
  }

}
