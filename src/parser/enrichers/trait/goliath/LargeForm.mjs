/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class LargeForm extends DDBEnricherData {

  get type() {
    return "utility";
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

  get effects() {
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

  get override() {
    const uses = this._getUsesWithSpent({
      type: "race",
      name: "Activate Large Form",
      max: 1,
      period: "lr",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
