import DDBEnricherData from "../../data/DDBEnricherData";

export default class EnchantmentsExtras extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return true;
  }

  override get builtFeaturesFromActionFilters(): any[] {
    return [this.name.replace("Enchantments:", "").trim()];
  }

}
