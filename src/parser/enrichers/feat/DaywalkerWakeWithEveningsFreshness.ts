import DDBEnricherData from "../data/DDBEnricherData";

/** Daywalker: starting a long rest, a DC 12 Constitution save lets you count as having at least 1 Blood Point for that rest. */
export default class DaywalkerWakeWithEveningsFreshness extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You start a Long Rest",
      noTemplate: true,
      data: {
        save: { ability: ["con"], dc: { calculation: "", formula: "12" } },
      },
    };
  }

}
