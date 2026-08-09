import DDBEnricherData from "../../data/DDBEnricherData";

export default class HarnessDivinePower extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      retainOriginalConsumption: true,
    };
  }

}
