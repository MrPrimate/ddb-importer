import DDBEnricherData from "../../data/DDBEnricherData";

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
