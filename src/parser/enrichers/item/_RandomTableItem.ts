import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

/**
 * An item whose whole effect is one row of a random table. Read as prose, the description yields
 * a save, damage and condition scraped from a single row, which is wrong for every other result.
 * The table die is rolled instead and the outcome resolved from the description, where the
 * importer has already linked the matching RollTable.
 */
export default abstract class RandomTableItem extends DDBEnricherData {

  /** The die the table is keyed on, such as "1d10". */
  abstract get tableFormula(): string;

  /** The label shown on the roll. */
  abstract get rollName(): string;

  /** What triggers the roll and how its result is read. */
  get rollCondition(): string {
    return "Resolve the result using the table in the description";
  }

  /** Most of these items leave the action economy to their prose. */
  get rollActivation(): TActivationCost {
    return "special";
  }

  /** A charge count quoted inside one table row is read as the item's own pool; such items drop it. */
  get clearScrapedUses(): boolean {
    return false;
  }

  /** The table roll as an extra activity, for an item whose primary is something else. */
  static tableRoll(name: string, formula: string, condition: string): IDDBAdditionalActivity {
    return itemActivity(name, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
      activationCondition: condition,
      data: { roll: { formula, prompt: false, visible: true, name } },
    });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData | null {
    if (!this.clearScrapedUses) return null;
    return { data: { system: { uses: { spent: null, max: "", recovery: [] } } } };
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.rollName,
      activationType: this.rollActivation,
      activationCondition: this.rollCondition,
      noConsumeTargets: true,
      noTemplate: true,
      noeffect: true,
      rangeSelf: true,
      targetType: "self",
      data: { roll: { formula: this.tableFormula, prompt: false, visible: true, name: this.rollName } },
    };
  }

}
