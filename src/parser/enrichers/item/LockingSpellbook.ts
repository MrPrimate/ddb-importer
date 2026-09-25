import DDBEnricherData from "../data/DDBEnricherData";

export default class LockingSpellbook extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) {
      return null;
    }
    return {
      name: "Pick Lock",
      activationType: "action",
      activationCondition: "Requires Thieves' Tools",
      noConsumeTargets: true,
      noTemplate: true,
      targetType: "self",
      targetCount: "1",
      rangeType: "touch",
      rangeValue: null,
      overrideRange: true,
      data: { check: { ability: "dex", associated: ["slt"], dc: { calculation: "", formula: "15" } } },
    };
  }

}
