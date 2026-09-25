import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class ConflagrantChannel extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Conflagrant Channel",
      ..._Illrigger.sealConsume(),
      activationType: "bonus",
      targetType: "self",
      rangeType: "ft",
      rangeValue: 60,
      data: {
        range: {
          units: "ft",
          value: "60",
          special: "An unoccupied space you can see",
        },
      },
    };
  }

}
