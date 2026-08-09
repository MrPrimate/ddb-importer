import DDBEnricherData from "../data/DDBEnricherData";

export default class Waterskin extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      activationType: "special",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "4",
        recovery: [],
        autoDestroy: false,
      },
    };
  }

}
