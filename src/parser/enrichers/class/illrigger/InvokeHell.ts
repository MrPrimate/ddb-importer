import DDBEnricherData from "../../data/DDBEnricherData";

export default class InvokeHell extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
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
