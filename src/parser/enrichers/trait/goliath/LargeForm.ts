import DDBEnricherData from "../../data/DDBEnricherData";

export default class LargeForm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("2", 30, "ATL.width"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 30, "ATL.height"),
        ],
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 25, "system.traits.size"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "race",
      name: "Activate Large Form",
      max: "1",
      period: "lr",
    });
    return {
      uses,
    };
  }

}
