import RandomTableItem from "./_RandomTableItem";

/**
 * Both the sown creatures and the implanted effect of a drawn tooth are columns of the d20 table. One tooth's own
 * charges sit in its row and would otherwise be read as a pool for the whole collection.
 */
export default class TeethOfDahlverNar extends RandomTableItem {

  override get tableFormula(): string {
    return "1d20";
  }

  override get rollName(): string {
    return "Draw Tooth";
  }

  override get rollActivation(): TActivationCost {
    return "action";
  }

  override get rollCondition(): string {
    return "Draw one tooth as an action, then sow or implant it; a used tooth's result becomes the next lowest unused tooth";
  }

  override get clearScrapedUses(): boolean {
    return true;
  }

}
