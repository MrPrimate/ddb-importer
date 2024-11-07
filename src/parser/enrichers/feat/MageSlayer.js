/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class MageSlayer extends DDBEnricherMixin {

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
          max: 1,
          recovery: [{ period: "sr", type: 'recoverAll' }],
        },
      },
    };
  }

}
