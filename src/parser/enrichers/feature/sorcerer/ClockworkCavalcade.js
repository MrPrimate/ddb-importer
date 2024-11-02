/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class ClockworkCavalcade extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Use",
      noConsumeTargets: true,
      // default scrape picks up the 5 sorcery point recharge effect
      addItemConsume: true,
      data: {
        range: {
          units: "self",
        },
        target: {
          template: {
            contiguous: false,
            type: "cube",
            size: "30",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Spend Sorcery Points to Restore Use",
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
                value: "7",
                target: "Font of Magic: Sorcery Points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get override() {
    return {
      replaceActivityUses: true,
    };
  }

}
