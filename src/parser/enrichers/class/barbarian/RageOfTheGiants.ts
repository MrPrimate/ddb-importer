import DDBEnricherData from "../../data/DDBEnricherData";

export default class RageOfTheGiants extends DDBEnricherData {

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
        name: "Rage of the Giants: Large",
        options: {
          description: "Large size: carrying capacity doubles, Advantage on Strength checks and saving throws, weapon and Unarmed Strike attacks deal one additional die of damage.",
        },
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
