import DDBEnricherData from "../../data/DDBEnricherData";

export default class LivingLegend extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Living Legend",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
    };
  }

  override get override(): IDDBOverrideData {
    // DDB's one action for this feature is "Living Legend", the same bonus action as the activity above
    const uses = this._getUsesWithSpent({ type: "class", name: "Living Legend", max: "1", period: "lr" });
    return {
      uses,
      data: {
        name: "Living Legend",
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Living Legend",
      changes: [
        DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("cha"),
      ],
      activitiesMatch: ["Activate Living Legend"],
    }];
  }

}
