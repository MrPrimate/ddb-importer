import DDBEnricherData from "../data/DDBEnricherData";

export default class Waterskin extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      type: "utility",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get override() {
    return {
      uses: {
        spent: null,
        max: "4",
        recovery: [],
        autoDestroy: false,
        autoUse: true,
      },
    };
  }

}
