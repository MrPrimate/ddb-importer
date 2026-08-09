import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";

export default class RiteFocusTheArchfey extends _RiteFocus {

  override get patronName(): string {
    return "The Archfey";
  }

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: _RiteFocus.DAMAGE_CONDITION,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Faelight",
        activityMatch: this.activityName,
        options: {
          description: "You shed faint light and gain no benefit from any cover or from being invisible, until the end of the blood hunter's next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#c8a2e0", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.5", 20, "token.light.alpha"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("glow"),
        ],
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
