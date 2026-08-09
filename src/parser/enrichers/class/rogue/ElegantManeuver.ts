import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElegantManeuver extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("acr"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("ath"),
        ],
        daeSpecialDurations: ["isSkill.acr" as const, "isSkill.ath" as const],
      },
    ];
  }

}
