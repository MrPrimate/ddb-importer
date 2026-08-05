import DDBEnricherData from "../../data/DDBEnricherData";

export default class InvokeHell extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Invoke Hell",
        max: "1",
        period: "sr",
      }),
    };
  }

}
