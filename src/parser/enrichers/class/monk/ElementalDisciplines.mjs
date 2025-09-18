/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalDisciplines extends DDBEnricherData {

  get type() {
    return this.isAction ? null : "none";
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
    return [this.name.replace("Elemental Disciplines:", "").trim()];
  }

}
