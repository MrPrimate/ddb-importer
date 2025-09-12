/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ZealousPresence extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get additionalActivities() {
    if (this.isAction) return [];
    return [
      {
        constructor: {
          name: "Spend Rage to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noEffects: true,
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
                value: "1",
                target: "Rage",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Zealous Presence",
      },
    ];
  }

  get override() {
    return {
      replaceActivityUses: true,
    };
  }
}
