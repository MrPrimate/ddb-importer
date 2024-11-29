/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WholenessOfBody extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    const formula = this.is2014
      ? "3@classes.monk.levels"
      : "@scale.monk.martial-arts.die + @abilities.wis.mod";
    return {
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: formula, type: "healing" }),
      },
    };
  }

}
