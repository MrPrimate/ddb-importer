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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Embody Legends", type: "class" } },
    ];
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({ type: "class", name: "Embody Legends", max: "1", period: "lr" });
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
