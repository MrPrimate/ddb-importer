import DDBEnricherData from "../data/DDBEnricherData";

export default class Generic extends DDBEnricherData {

  get actionType() {
    return "feat";
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get override(): IDDBOverrideData {
    return null;
  }

}
