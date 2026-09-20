import RandomTableItem from "./_RandomTableItem";

/**
 * The satchel produces four seeds at dawn and a d6 on the table sets the nature of each.
 */
export default class SovereignseedSatchel extends RandomTableItem {

  override get tableFormula(): string {
    return "1d6";
  }

  override get rollName(): string {
    return "Seed";
  }

  override get rollCondition(): string {
    return "Roll once for each of the four seeds the first time the satchel is opened each day";
  }

}
