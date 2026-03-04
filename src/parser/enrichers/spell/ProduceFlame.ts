import DDBEnricherData from "../data/DDBEnricherData";

export default class ProduceFlame extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {

    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      return [
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
        {
          init: {
            name: "Place Light on Token",
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
              parameters: `{"distance":20,"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":40,"bright":20},"flag":"light","forceOn":true}`,
            },
            targetOverride: {
              override: true,
              affects: { type: "self" },
              template: {},
            },
          },
        },
      ];
    }
  }

  get override() {
    return {
      data: {
        "system.range": {
          value: "30",
          units: "ft",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Apply Light Effect",
        atlOnly: true,
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "40"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#ffffff"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "{\"type\": \"pulse\", \"speed\": 3,\"intensity\": 1}"),
        ],
      },
    ];
  }

}
