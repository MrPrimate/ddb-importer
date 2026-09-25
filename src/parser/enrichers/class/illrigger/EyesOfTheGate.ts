import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class EyesOfTheGate extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Eyes of the Gate",
      ..._Illrigger.sealConsume(),
      // the bond lasts one hour per seal expended
      addScalingMode: "amount",
      addConsumptionScalingMax: "@scale.illrigger.seals",
      activationType: "action",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 60,
      data: {
        save: {
          ability: ["wis"],
          dc: _Illrigger.INTERDICT_DC,
        },
        duration: {
          units: "spec",
          value: "",
          special: "1 hour per seal expended",
        },
      },
    };
  }

}
