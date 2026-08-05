import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Passive Blood Point maximum increase (+Con modifier); the DDB action would
 * otherwise attach as a junk activity. The pool increase is not automated -
 * adjust the Blood Potency pool manually.
 */
export default class VitaeConcentration extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return false;
  }

}
