import DDBEnricherData from "../../data/DDBEnricherData";

export default class DemiurgicColossus extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
    };
  }

  get effects(): IDDBEffectHint[] {
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
