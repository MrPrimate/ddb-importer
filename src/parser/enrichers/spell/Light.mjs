/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Light extends DDBEnricherData {

  get additionalActivities() {
    const template = {
      constructor: {
        name: "Place or Remove Light",
        type: "ddbmacro",
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
          parameters: '{"distance":20,"isTemplate":true,"lightConfig":{"dim":40,"bright":20},"flag":"light"}',
        },
        targetOverride: {
          override: true,
          affects: { type: "" },
          template: {},
        },
      },
    };
    if (DDBEnricherData.effectModules().atlInstalled) {
      return [
        template,
        {
          constructor: {
            name: "Apply Light Effect",
            type: "utility",
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
          constructor: {
            name: "Place on Targetted Token or Remove",
            type: "ddbmacro",
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
              parameters: '{"distance":20,"targetsToken":true,"lightConfig":{"dim":40,"bright":20},"flag":"light"}',
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

  get override() {
    return {
      data: {
        "flags.midiProperties.autoFailFriendly": true,
      },
    };
  }

  get effects() {
    return [
      {
        activityMatch: "Apply Light Effect",
        atlChanges: [
          DDBEnricherData.generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '40'),
          DDBEnricherData.generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '20'),
          DDBEnricherData.generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
          DDBEnricherData.generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
          DDBEnricherData.generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '{"type": "pulse", "speed": 3,"intensity": 1}'),
        ],
      },
    ];
  }

}
