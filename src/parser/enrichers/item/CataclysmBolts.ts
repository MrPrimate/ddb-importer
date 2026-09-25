import RandomTableItem from "./_RandomTableItem";

/**
 * Ammunition that deals normal damage and then one of the table's disasters, chosen by a d6 on a hit.
 */
export default class CataclysmBolts extends RandomTableItem {

  override get tableFormula(): string {
    return "1d6";
  }

  override get rollName(): string {
    return "Cataclysm";
  }

  override get rollCondition(): string {
    return "When the bolt hits, after its normal damage; resolve the result using the table in the description";
  }

}
