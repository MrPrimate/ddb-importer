import DDBEnricherData from "../data/DDBEnricherData";
import RandomTableItem from "./_RandomTableItem";

/**
 * A bag holds a single kind of kernel, set once by a d8 on the table, so the type roll spends
 * nothing; throwing a kernel destroys it and is what uses the bag up. Read as prose, the item
 * became a save scraped from one kernel's row.
 */
export default class TossableKernels extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw Kernel",
      targetType: "space",
      activationType: "action",
      activationCondition: "Resolve the kernel's effect using the table in the description",
      addItemConsume: true,
      noTemplate: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        range: { override: true, value: "20", units: "ft" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      RandomTableItem.tableRoll("Kernel Type", "1d8", "The GM rolls once per bag found, or chooses from the table"),
    ];
  }

}
