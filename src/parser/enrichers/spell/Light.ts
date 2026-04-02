import DDBEnricherData from "../data/DDBEnricherData";

export default class Light extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    const template: IDDBAdditionalActivity = {
      init: {
        name: "Place or Remove Light",
        type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
      },
      build: {
        noeffect: true,
        generateConsumption: false,
        generateTarget: true,
        generateRange: false,
        generateActivation: true,
        generateDDBMacro: true,
        ddbMacroOverride: {
          name: "Place or Remove Light",
          function: "ddb.generic.light",
          visible: false,
          parameters: `{"distance":20,"isTemplate":true,"lightConfig":{"dim":40,"bright":20},"flag":"light","forceOn":true}`,
        },
        targetOverride: {
          override: true,
          affects: { type: "" },
          template: {},
        },
      },
    };
    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      return [
        template,
        {
          init: {
            name: "Apply Light Effect",
            type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
          },
          build: {
            generateConsumption: true,
            generateTarget: true,
            generateRange: false,
            generateActivation: true,
            targetOverride: {
              override: true,
              affects: { type: "" },
              template: {},
            },
          },
        },
      ];
    } else {
      return [
        template,
        {
          init: {
            name: "Place on Targetted Token or Remove",
            type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
          },
          build: {
            generateConsumption: false,
            generateTarget: true,
            generateRange: false,
            generateActivation: true,
            generateDDBMacro: true,
            ddbMacroOverride: {
              name: "Place on Targetted Token",
              function: "ddb.generic.light",
              visible: false,
              parameters: `{"distance":20,"targetsToken":true,"lightConfig":{"dim":40,"bright":20},"flag":"light","forceOn":true}`,
            },
            targetOverride: {
              override: true,
              affects: { type: "" },
              template: {},
            },
          },
        },
      ];
    }
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        "flags.midiProperties.autoFailFriendly": true,
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Apply Light Effect",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "override", "40"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "override", "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "override", "#ffffff"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "override", "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", "override", "{\"type\": \"pulse\", \"speed\": 3,\"intensity\": 1}"),
        ],
      },
    ];
  }

}
