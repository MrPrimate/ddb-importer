import DDBEnricherData from "../data/DDBEnricherData";

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
    return {
      uses: { spent: 0, max: "7", recovery: [{ period: "day", type: "formula", formula: "1" }] },
    };
  }

}
