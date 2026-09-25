import RandomTableItem from "./_RandomTableItem";

/**
 * Each bullet in the pouch has its own property, set by a d4 on the table.
 */
export default class SlingBulletsOfAlthemone extends RandomTableItem {

  override get tableFormula(): string {
    return "1d4";
  }

  override get rollName(): string {
    return "Bullet Property";
  }

  override get rollCondition(): string {
    return "Roll once per bullet to set its property; resolve it using the table in the description when that bullet hits";
  }

}
