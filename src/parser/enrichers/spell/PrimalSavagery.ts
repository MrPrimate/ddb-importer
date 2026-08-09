import DDBEnricherData from "../data/DDBEnricherData";

export default class PrimalSavagery extends DDBEnricherData {

  override get override(): IDDBOverrideData {
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
