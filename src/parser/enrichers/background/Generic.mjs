/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Generic extends DDBEnricherData {

  get actionType() {
    return "race";
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get override() {
    return null;
  }

}
