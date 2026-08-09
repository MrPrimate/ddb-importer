import DDBEnricherData from "../../data/DDBEnricherData";

export default class Survivor extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Heroic Rally",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "5 + @abilities.con.mod",
          types: ["healing"],
        }),
      },
    };
  }

}
