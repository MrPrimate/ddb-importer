import DDBEnricherData from "../data/DDBEnricherData";

export default class None extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

}
