import DDBEnricherData from "../../data/DDBEnricherData";

export default class RecklessAbandon extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
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
