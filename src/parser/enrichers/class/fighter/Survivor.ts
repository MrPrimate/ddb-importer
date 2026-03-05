import DDBEnricherData from "../../data/DDBEnricherData";

export default class Survivor extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
