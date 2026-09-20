import DDBEnricherData from "../data/DDBEnricherData";
import RandomTableItem from "./_RandomTableItem";
import { itemText } from "./_ItemActivities";

/**
 * Raw delerium in every crystal size, both printings. The contamination save sits outside the
 * Arcane Anomalies table and stays the primary; the damage and escape check the parser adds
 * beside it are rows of that table. The earlier printing keys the table on a d20, the later
 * one on a d100.
 */
export default class Delerium extends DDBEnricherData {

  /** The table heading carries the die: "1d20 Arcane Anomalies" or "1d100 Arcane Anomalies". */
  get anomalyFormula(): string {
    return (/d100/i).test(itemText(this)) ? "1d100" : "1d20";
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Contamination",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition:
        "A humanoid touches unprotected delerium for the first time on its turn or ends its turn touching it; "
        + "a failure also adds one level of contamination",
      noConsumeTargets: true,
      noTemplate: true,
      noeffect: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic"] }),
      ],
      data: {
        damage: { onSave: "none" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      RandomTableItem.tableRoll(
        "Arcane Anomaly",
        this.anomalyFormula,
        "When a geode is destroyed; resolve the result using the table in the description",
      ),
    ];
  }

}
