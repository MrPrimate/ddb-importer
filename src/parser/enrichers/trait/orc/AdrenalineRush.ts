import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdrenalineRush extends DDBEnricherData {

  override get addAutoAdditionalActivities() {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      targetSelf: true,
    };
  }

}
