import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdvancedArtifice extends DDBEnricherData {

  override get type() {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    return this.is2014
      ? null
      : {
        name: "Add Charge to Flash of Genius",
        addItemConsume: true,
        itemConsumeTargetName: "Flash of Genius",
        activationType: "special",
        activationCondition: "On short rest",
        activityConsumeValue: "-1",
      };
  }
}
