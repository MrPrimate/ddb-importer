/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GiantsHavocGiantStature extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "special",
    };
  }

  get effects() {
    return [
      {
        name: "Giant Stature",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 20, "system.traits.size"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(2, 5, "ATL.width"),
          DDBEnricherData.ChangeHelper.upgradeChange(2, 5, "ATL.height"),
        ],
      },
    ];
  }


}
