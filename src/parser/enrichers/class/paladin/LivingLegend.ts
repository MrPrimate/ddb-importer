import DDBEnricherData from "../../data/DDBEnricherData";

export default class LivingLegend extends DDBEnricherData {

  get activity() {
    return {
      name: "Activate Living Legend",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Embody Legends", type: "class" } },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Embody Legends", max: "1", period: "lr" });
    return {
      uses,
      data: {
        name: "Living Legend",
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Living Legend",
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.cha.check.roll.mode"),
      ],
      activitiesMatch: ["Activate Living Legend"],
    }];
  }

}
