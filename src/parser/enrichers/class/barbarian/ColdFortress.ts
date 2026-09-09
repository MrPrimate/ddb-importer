import DDBEnricherData from "../../data/DDBEnricherData";

export default class ColdFortress extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Free when you enter your Rage while unarmored; expend a Hit Die on later turns while raging",
      data: {
        range: {
          units: "self",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1d12 + @abilities.con.mod",
          types: ["temphp"],
        }),
      },
    };
  }

}
