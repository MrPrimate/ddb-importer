import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The reference list of every mutagen. Each one the blood hunter actually knows imports as its
 * own "Formula: <Name>" document, so this is description only.
 */
export default class Mutagens extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get clearAutoEffects() {
    return true;
  }

}
