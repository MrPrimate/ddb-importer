/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RendMind extends DDBEnricherData {

  get activity() {
    if (this.is2014) {
      return {
        addItemConsume: true,
      };
    } else {
      return {
        addItemConsume: true,
        data: {
          save: {
            dc: { formula: "", calculation: "dex" },
            ability: ["wis"],
          },
        },
      };
    }
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Spend Psionic Energy Die to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "3",
                target: "Psionic Power",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Psychic Blades: Rend Mind",
      max: "1",
      period: "lr",
    });

    return {
      replaceActivityUses: true,
      data: {
        "system.uses": uses,
      },
    };
  }

}
