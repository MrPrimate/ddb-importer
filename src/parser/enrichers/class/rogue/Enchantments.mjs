/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Enchantments extends DDBEnricherData {

  get type() {
    return "none";
  }

  get addAutoAdditionalActivities() {
    return false;
  }

  get useDefaultAdditionalActivities() {
    return false;
  }

}
