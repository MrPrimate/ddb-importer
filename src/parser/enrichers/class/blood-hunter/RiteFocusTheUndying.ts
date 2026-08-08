import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";
import _RiteFocus from "./_RiteFocus";

export default class RiteFocusTheUndying extends _RiteFocus {

  get patronName(): string {
    return "The Undying";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "When you reduce a hostile creature of at least mild threat to 0 hit points, while you have an active crimson rite",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: _BloodHunter.DIE,
          types: ["healing"],
        }),
      },
    };
  }

}
