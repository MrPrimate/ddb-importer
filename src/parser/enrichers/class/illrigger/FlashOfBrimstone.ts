import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class FlashOfBrimstone extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Flash of Brimstone",
      activationType: "special",
      activationCondition: "When you place or move a seal (no action required)",
      targetType: "self",
      noTemplate: true,
      rangeType: "ft",
      rangeValue: 5,
      rangeSpecial: "An unoccupied space you can see within 5 feet of the interdicted creature",
    };
  }

}
