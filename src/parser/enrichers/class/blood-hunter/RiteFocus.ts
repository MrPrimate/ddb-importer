import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";

/**
 * The parent Rite Focus feature. Suppressed
 *
 */
export default class RiteFocus extends _RiteFocus {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

}
