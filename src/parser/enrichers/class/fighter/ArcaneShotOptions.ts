import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneShotOptions extends DDBEnricherData {

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
