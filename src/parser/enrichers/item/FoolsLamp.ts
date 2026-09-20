import RandomTableItem from "./_RandomTableItem";

/**
 * Every outcome of wishing on the lamp is a row of the d10 table, which the GM may also pick from.
 */
export default class FoolsLamp extends RandomTableItem {

  override get tableFormula(): string {
    return "1d10";
  }

  override get rollName(): string {
    return "Wish Outcome";
  }

  override get rollActivation(): TActivationCost {
    return "action";
  }

  override get rollCondition(): string {
    return "When a creature holding the lamp speaks a wish as an action; the GM may choose instead of rolling";
  }

}
