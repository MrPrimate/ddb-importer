import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarpingImplosion extends DDBEnricherData {

  get activity() {
    return {
      noConsumeTargets: true,
      // default scrape picks up the 5 sorcery point recharge effect
      addItemConsume: true,
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend Sorcery Points to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
                target: "Sorcery Points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
