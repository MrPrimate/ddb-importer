import DDBEnricherData from "../data/DDBEnricherData";

export default class Generic extends DDBEnricherData {

  get actionType() {
    return "feat";
  }

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get override(): IDDBOverrideData | null {
    return null;
  }

}
