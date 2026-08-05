import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Both benefits (Feed Die reroll on 1s, +5 Blood Point maximum) are passive;
 * the DDB actions would otherwise attach as junk activities. The Blood Point
 * maximum increase is not automated - adjust the Blood Potency pool manually.
 */
export default class BoonOfGenerations extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return false;
  }

}
