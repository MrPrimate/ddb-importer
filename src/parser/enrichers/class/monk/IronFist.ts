import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Street level 3: Unarmed Strike hits against objects are Critical Hits. Roll data
 * cannot tell an object from a creature, so the feature is description only and the empty DDB
 * action activity is dropped.
 */
export default class IronFist extends DDBEnricherData {

  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

}
