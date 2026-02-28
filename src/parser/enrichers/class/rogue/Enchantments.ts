import DDBEnricherData from "../../data/DDBEnricherData";

export default class Enchantments extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get addAutoAdditionalActivities() {
    return false;
  }

  get useDefaultAdditionalActivities() {
    return false;
  }

}
