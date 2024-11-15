/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class LayOnHandsPurifyPoison extends DDBEnricherData {

  get activity() {
    return {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "5",
    };
  }

}
