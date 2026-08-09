import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneShotOptions extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

}
