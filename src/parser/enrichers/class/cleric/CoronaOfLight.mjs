/* eslint-disable class-methods-use-this */
import { effectModules } from "../../../../effects/effects.js";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CoronaOfLight extends DDBEnricherData {

  get type() {
    return effectModules().atlInstalled
      ? "utility"
      : "ddbmacro";
  }

  get activity() {
    if (effectModules().atlInstalled) {
      return {
        type: "utility",
        data: {
          name: "Use/Apply Light",
        },
      };
    } else {
      return {
        type: "ddbmacro",
        data: {
          name: "Use/Apply Light",
          macro: {
            name: "Apply Light",
            function: "ddb.generic.light",
            visible: false,
            parameters: '{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":60,"bright":30},"flag":"light"}',
          },
        },
      };
    }
  }


  get effects() {
    if (!effectModules().atlInstalled) return [];
    return [{
      options: {
      },
      data: {
        "flags.ddbimporter.activityMatch": "Use/Apply Light",
      },
      atlChanges: [
        DDBEnricherData.generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '30'),
        DDBEnricherData.generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '60'),
        DDBEnricherData.generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
        DDBEnricherData.generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
      ],
    }];

  }


}
