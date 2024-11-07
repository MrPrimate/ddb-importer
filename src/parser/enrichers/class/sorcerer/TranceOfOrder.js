/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class TranceOfOrder extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Enter Trance",
      activationType: "bonus",
      noConsumeTargets: true,
      // default scrape picks up the 5 sorcery point recharge effect
      addItemConsume: true,
      duration: {
        value: 1,
        units: "minute",
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
                value: "5",
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
      "flags.ddbimporter.dndbeyond": {
        retainOriginalConsumption: true,
      },
      data: {
        "system.uses": {
          spent: 0,
          max: 1,
          recovery: [
            {
              period: "lr",
              type: "recoverAll",
              formula: "",
            },
          ],
        },
      },
    };
  }

  get effects() {
    return [{
      name: "Trance of Order",
      options: {
        description: "attack rolls against you can't benefit from Advantage, treat D20 Test rolls of 9 or lower on the d20 as a 10.",
        durationSeconds: 60,
      },
    }];
  }

}
