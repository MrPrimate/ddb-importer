import DDBEnricherData from "../data/DDBEnricherData";

export default class HealersKit extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "action",
      targetType: "creature",
      data: {
        range: {
          units: "touch",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      retainResourceConsumption: true,
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "10",
        recovery: [],
        autoDestroy: false,
      },
    };
  }

}
