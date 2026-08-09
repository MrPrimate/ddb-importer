import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElementalDisciplines extends DDBEnricherData {

  override get type() {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get addToDefaultAdditionalActivities() {
    return false;
  }

  override get addAutoAdditionalActivities() {
    return true;
  }

  override get builtFeaturesFromActionFilters() {
    return [this.name.replace("Elemental Disciplines:", "").trim()];
  }

}
