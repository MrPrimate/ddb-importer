import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";

/**
 * The parent Rite Focus feature. Suppressed
 *
 */
export default class RiteFocus extends _RiteFocus {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get useDefaultAdditionalActivities(): boolean {
    return false;
  }

}
