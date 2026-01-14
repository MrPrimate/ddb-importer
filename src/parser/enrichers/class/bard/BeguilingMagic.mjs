/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BeguilingMagic extends DDBEnricherData {

  get activity() {
    return {
      name: "Save",
      addItemConsume: true,
      activationType: "special",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Recharge",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "class",
          name: "Beguiling Magic",
          max: "1",
          period: "lr",
        }),
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Save"],
          retainOriginalConsumption: true,
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Frightened",
        options: {
        },
        statuses: ["Frightened"],
      },
      {
        name: "Charmed",
        options: {
        },
        statuses: ["Charmed"],
      },
    ];
  }

}
