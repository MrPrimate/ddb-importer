import DDBEnricherData from "../data/DDBEnricherData";

export default class Waterskin extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      activationType: "special",
      addItemConsume: true,
    };
  }

  get override(): IDDBOverrideData {
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
