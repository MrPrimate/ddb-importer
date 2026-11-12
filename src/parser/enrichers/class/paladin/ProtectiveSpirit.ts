import DDBEnricherData from "../../data/DDBEnricherData";

export default class ProtectiveSpirit extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "turnEnd",
      activationCondition: "Reduced to half HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `1d6 + (@classes.${this.classIdentifier("Paladin")}.levels / 2)`,
          types: ["healing"],
        }),
      },
    };
  }

}
