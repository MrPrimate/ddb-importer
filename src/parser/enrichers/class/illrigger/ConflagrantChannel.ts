import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class ConflagrantChannel extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Conflagrant Channel",
      ..._Illrigger.sealConsume(),
      activationType: "bonus",
      targetType: "self",
      rangeType: "ft",
      rangeValue: 60,
      rangeSpecial: "An unoccupied space you can see",
    };
  }

}
