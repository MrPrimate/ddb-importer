import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttackSupremeSneak extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
    };
  }

}
