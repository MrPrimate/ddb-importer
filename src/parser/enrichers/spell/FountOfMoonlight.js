/* eslint-disable class-methods-use-this */
import { effectModules } from "../../../effects/effects.js";
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class FountOfMoonlight extends DDBEnricherMixin {

  get type() {
    return effectModules().atlInstalled ? "utility" : "ddbmacro";
  }

  get activity() {
    if (effectModules().atlInstalled) {
      return {
        name: "Cast Spell",
      };
    } else {
      return {
        name: "Cast Spell",
        data: {
          macro: {
            name: "Place Light on Token",
            function: "ddb.generic.light",
            visible: false,
            parameters: '{"distance":20,"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":40,"bright":20},"flag":"light"}',
          },
        },
      };
    }
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Force Blinding Save",
          type: "save",
        },
        build: {
          generateDamage: false,
          generateSave: true,
          noSpellslot: true,
          rangeOverride: {
            value: "60",
            units: "ft",
            special: "",
          },
          targetOverride: {
            affects: {
              type: "creature",
              count: "1",

            },
            template: {
              count: "",
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "",
            },
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        name: "Wreathed in Moonlight",
        activityMatch: "Cast Spell",
        options: {
          durationSeconds: 600,
          durationRounds: 60,
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("radiant", 20, "system.traits.dr.value"),
          DDBEnricherMixin.generateUnsignedAddChange("2d6[radiant]", 20, "system.bonuses.mwak.damage"),
          DDBEnricherMixin.generateUnsignedAddChange("2d6[radiant]", 20, "system.bonuses.msak.damage"),
        ],
        atlChanges: [
          DDBEnricherMixin.generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '40'),
          DDBEnricherMixin.generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '20'),
          DDBEnricherMixin.generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
          DDBEnricherMixin.generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
        ],
      },
      {
        name: "Blinded by Moonlight",
        activityMatch: "Force Blinding Save",
        options: {
          durationSeconds: 6,
        },
        statuses: ["Blinded"],
      },
    ];
  }

}
