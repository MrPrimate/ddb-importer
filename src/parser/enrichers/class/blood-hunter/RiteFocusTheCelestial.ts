import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";
import _RiteFocus from "./_RiteFocus";

export default class RiteFocusTheCelestial extends _RiteFocus {

  override get patronName(): string {
    return "The Celestial";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
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
