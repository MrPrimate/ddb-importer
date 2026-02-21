import DDBEnricherData from "../../data/DDBEnricherData";

export default class WholenessOfBody extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    const formula = this.is2014
      ? "3 * @classes.monk.levels"
      : "@scale.monk.die.die + @abilities.wis.mod";
    return {
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: formula, type: "healing" }),
      },
    };
  }

}
