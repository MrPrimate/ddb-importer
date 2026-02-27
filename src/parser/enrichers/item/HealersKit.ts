import DDBEnricherData from "../data/DDBEnricherData";

export default class HealersKit extends DDBEnricherData {

  get type() {
    return "utility";
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

  get override() {
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
