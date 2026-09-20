import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The parent only says that a haint is chosen. Left to the defaults it builds every haint
 * action itself, and a lone chosen option then merges into a parent that already has
 * activities, which throws the option's own away. Building nothing here lets the chosen haint
 * supply them.
 */
export default class HandyHaints extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

}
