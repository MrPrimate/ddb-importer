import DDBEnricherData from "../../data/DDBEnricherData";

export default class ProtectiveSpirit extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "turnEnd",
      condition: "Reduced to half HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1d6 + (@classes.paladin.levels / 2)",
          types: ["healing"],
        }),
      },
    };
  }

}
