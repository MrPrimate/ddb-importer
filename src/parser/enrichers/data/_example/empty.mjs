/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Empty extends DDBEnricherData {

  get type() {
    return null;
  }

  get activity() {
    return null;
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return null;
  }

  // keep this if you want to use the default generated actions
  get useDefaultAdditionalActivities() {
    return true;
  }

  // use this if you want to add to default actions
  get addToDefaultAdditionalActivities() {
    return true;
  }

}
