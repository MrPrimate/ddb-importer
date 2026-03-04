import DDBEnricherData from "../data/DDBEnricherData";

export default class HealersKit extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
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

  get override(): IDDBOverrideData {
    return {
      retainResourceConsumption: true,
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "10",
        recovery: [],
        autoDestroy: false,
        autoUse: true,
      },
    };
  }

}
