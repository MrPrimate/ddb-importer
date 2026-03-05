import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsionicSorcery extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      addScalingMode: "amount",
      addConsumptionScalingMax: "9",
    };
  }

}
