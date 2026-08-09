import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The list of mutagen formulas the blood hunter knows. The formulas themselves import as
 * separate "Formula: <Name>" documents, so this one carries nothing but its description.
 */
export default class Formulas extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
