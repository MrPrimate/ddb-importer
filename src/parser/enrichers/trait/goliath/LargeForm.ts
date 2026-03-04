import DDBEnricherData from "../../data/DDBEnricherData";

export default class LargeForm extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 25, "system.traits.size"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("2", 30, "ATL.width"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 30, "ATL.height"),
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
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
