/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TirelessSpirit extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Regain 1 Use",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "encounter",
    };
  }

}
