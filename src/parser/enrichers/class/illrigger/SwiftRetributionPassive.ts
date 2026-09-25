import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * A passive boon: the free opportunity attack is made with the weapon, so there is nothing to
 * activate here. Without this the document carries two empty utility activities.
 */
export default class SwiftRetributionPassive extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

}
