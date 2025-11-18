/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DivineForeknowledge extends DDBEnricherData {

  get activity() {
    return {
      name: "Divine Foreknowledge",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Spend Spell Slot to Restore Use",
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
            scaling: { allowed: true, max: "" },
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "6",
                scaling: { mode: "level", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }

}
