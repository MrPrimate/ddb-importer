/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DemiurgicColossus extends DDBEnricherData {

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
        name: "Demiurgic Colossus",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("hg", 20, "system.traits.size"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(3, 5, "ATL.width"),
          DDBEnricherData.ChangeHelper.upgradeChange(3, 5, "ATL.height"),
        ],
      },
    ];
  }

}
