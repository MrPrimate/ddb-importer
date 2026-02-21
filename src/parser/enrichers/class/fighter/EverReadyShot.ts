import DDBEnricherData from "../../data/DDBEnricherData";

export default class EverReadyShot extends DDBEnricherData {

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
