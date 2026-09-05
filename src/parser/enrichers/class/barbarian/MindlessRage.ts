import DDBEnricherData from "../../data/DDBEnricherData";

export default class MindlessRage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Apply Mindless Rage",
      activationType: "special",
      activationCondition: "When you use Rage",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
          disabled: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
        ],
      },
    ];
  }

}
