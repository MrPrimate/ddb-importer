import DDBEnricherData from "../../data/DDBEnricherData";

export default class RageOfTheTitans extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "When you activate your Rage",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rage of the Titans: Huge",
        options: {
          description: "Huge size: carrying capacity triples, reach increases by 5 feet, Advantage on Strength checks and saving throws, weapon and Unarmed Strike attacks deal two additional dice of damage.",
        },
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
