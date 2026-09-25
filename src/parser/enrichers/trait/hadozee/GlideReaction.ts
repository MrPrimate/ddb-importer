import DDBEnricherData from "../../data/DDBEnricherData";

export default class GlideReaction extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Glide",
      activationType: "reaction",
      activationCondition: "When you fall",
      targetType: "self",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }

}
