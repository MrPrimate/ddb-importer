import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsionicSorcery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      addScalingMode: "amount",
      addConsumptionScalingMax: "9",
    };
  }

}
