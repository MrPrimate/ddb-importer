/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MageSlayer extends DDBEnricherData {

  get activity() {
    return {
      name: "Guarded Mind",
      type: "utility",
    };
  }

  get override() {
    return {
      data: {
        name: "Mage Slayer",
        "flags.ddbimporter.dndbeyond": {
          retainResourceConsumption: true,
        },
        "system.uses": {
          spent: 0,
          max: "1",
          recovery: [{ period: "sr", type: 'recoverAll' }],
        },
      },
    };
  }

}
