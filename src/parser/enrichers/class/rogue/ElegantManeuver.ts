import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElegantManeuver extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

  get effects(): IDDBEffectHint[] {
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
