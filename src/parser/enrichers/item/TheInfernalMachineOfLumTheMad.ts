import RandomTableItem from "./_RandomTableItem";

/**
 * Working the controls produces one of a hundred table rows, each carrying its own saves and damage.
 */
export default class TheInfernalMachineOfLumTheMad extends RandomTableItem {

  override get tableFormula(): string {
    return "1d100";
  }

  override get rollName(): string {
    return "Machine Effect";
  }

  override get rollCondition(): string {
    return "When the controls are worked; resolve both property columns using the table in the description";
  }

}
