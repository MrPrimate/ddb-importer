/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TelekineticMaster extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Spend Energy Die to Regain Use",
      addItemConsume: true,
      activationType: "",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainChildUses": true,
        "system.uses": this._getUsesWithSpent({
          type: "class",
          name: "Telekinetic Master: Weapon Attack",
          max: "1",
          period: "lr",
        }),
      },
    };
  }

}
