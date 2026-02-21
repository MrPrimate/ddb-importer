import DDBEnricherData from "../data/DDBEnricherData";

export default class PrimalSavagery extends DDBEnricherData {

  get override() {
    return {
      data: {
        "system.range": {
          value: "5",
          units: "ft",
        },
      },
    };
  }

}
