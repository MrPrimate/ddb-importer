import DDBEnricherData from "../../data/DDBEnricherData";

export default class LayOnHandsPurifyPoison extends DDBEnricherData {

  get activity() {
    return {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "5",
    };
  }

}
