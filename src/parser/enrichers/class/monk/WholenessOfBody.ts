import DDBEnricherData from "../../data/DDBEnricherData";

export default class WholenessOfBody extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
