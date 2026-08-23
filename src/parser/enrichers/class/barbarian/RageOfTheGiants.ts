import DDBEnricherData from "../../data/DDBEnricherData";

export default class RageOfTheGiants extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "When you activate your Rage",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rage of the Giants: Large",
        options: {
          description: "Large size: carrying capacity doubles, Advantage on Strength checks and saving throws, weapon and Unarmed Strike attacks deal one additional die of damage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 20, "system.traits.size"),
        ],
      },
    ];
  }

}
