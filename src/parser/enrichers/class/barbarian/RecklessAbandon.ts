import DDBEnricherData from "../../data/DDBEnricherData";

export default class RecklessAbandon extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.con.mod",
          types: ["temphp"],
        }),
      },
    };
  }

}
