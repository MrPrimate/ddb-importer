import DDBEnricherData from "../data/DDBEnricherData";

export default class None extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

}
