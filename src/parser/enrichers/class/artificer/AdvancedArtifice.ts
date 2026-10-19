import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdvancedArtifice extends DDBEnricherData {

  get type() {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return this.is2014
      ? null
      : {
        name: "Add Charge to Flash of Genius",
        addItemConsume: true,
        itemConsumeTargetName: "Flash of Genius",
        // restores one Flash of Genius use rather than spending one
        itemConsumeValue: "-1",
        activationType: "shortRest",
        activationCondition: "On short rest",
      };
  }
}
