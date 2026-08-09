import DDBEnricherData from "../../data/DDBEnricherData";

export default class ControlledChanneling extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      itemConsumeValue: 1,
    };
  }
}
