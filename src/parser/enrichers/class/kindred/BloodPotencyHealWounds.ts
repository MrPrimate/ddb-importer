import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodPotencyHealWounds extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1d10 + @classes.kindred.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
