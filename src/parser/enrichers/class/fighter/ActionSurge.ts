import DDBEnricherData from "../../data/DDBEnricherData";

export default class ActionSurge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Action Surge",
      activationType: "special",
      targetType: "self",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      removeDamage: true,
    };
  }

}
