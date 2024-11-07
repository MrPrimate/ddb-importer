/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class DivineIntervention extends DDBEnricherMixin {

  get activity() {
    if (this.is2014) {
      return {
        type: "utility",
        addItemConsume: true,
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula: "1d100",
            name: "Implore Aid",
          },
        },
      };
    } else {
      return {
        type: "utility",
        addItemConsume: true,
      };
    }
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
        "system.uses": {
          value: "0",
          max: "1",
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
