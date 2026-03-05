import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdrenalineRush extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      targetSelf: true,
    };
  }

}
