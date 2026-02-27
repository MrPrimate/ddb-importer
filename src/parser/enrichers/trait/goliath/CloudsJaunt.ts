import DDBEnricherData from "../../data/DDBEnricherData";

export default class CloudsJaunt extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  get override() {
    return {
      uses: this._getUsesWithSpent({
        type: "race",
        name: this.ddbParser.originalName,
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
