/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Survivor extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
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
