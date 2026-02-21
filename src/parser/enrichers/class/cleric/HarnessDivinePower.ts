import DDBEnricherData from "../../data/DDBEnricherData";

export default class HarnessDivinePower extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
      },
    };
  }

}
