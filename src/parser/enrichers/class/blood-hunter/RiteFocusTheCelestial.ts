import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";
import _RiteFocus from "./_RiteFocus";

export default class RiteFocusTheCelestial extends _RiteFocus {

  get patronName(): string {
    return "The Celestial";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 60,
      activationType: "bonus",
      activationCondition: _RiteFocus.RITE_CONDITION,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `${_BloodHunter.DIE} + ${this.hemocraftModifierMin1}`,
          types: ["healing"],
        }),
      },
    };
  }

}
