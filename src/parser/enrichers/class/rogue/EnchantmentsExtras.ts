import DDBEnricherData from "../../data/DDBEnricherData";

export default class EnchantmentsExtras extends DDBEnricherData {

  get type() {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return false;
  }

  get addAutoAdditionalActivities() {
    return true;
  }

  get builtFeaturesFromActionFilters() {
    return [this.name.replace("Enchantments:", "").trim()];
  }

}
