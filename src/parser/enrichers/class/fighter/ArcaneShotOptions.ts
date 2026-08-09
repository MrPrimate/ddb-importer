import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneShotOptions extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get addAutoAdditionalActivities() {
    return false;
  }

  override get useDefaultAdditionalActivities() {
    return false;
  }

}
