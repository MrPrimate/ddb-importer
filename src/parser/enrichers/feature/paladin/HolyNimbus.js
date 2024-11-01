/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class HolyNimbus extends DDBEnricherMixin {

  get activity() {
    if (DDBEnricherMixin.effectModules().atlInstalled) {
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
            parameters: '{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":0,"bright":20},"flag":"light"}',
          },
        },
      };
    }
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Aura Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBEnricherMixin.basicDamagePart({ customFormula: "@abilities.mod.cha + @prof", types: ["radiant"] })],
        },
      },
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
                target: "5",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effect() {
    return {
      multiple: () => {
        let effects = [];
        if (DDBEnricherMixin.effectModules().atlInstalled) {
          effects.push({
            options: {
            },
            data: {
              "flags.ddbimporter.activityMatch": "Use/Apply Light",
            },
            atlChanges: [
              DDBEnricherMixin.generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '@scale.paladin.aura-of-protection'),
              DDBEnricherMixin.generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
              DDBEnricherMixin.generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
            ],
          });
        }
      },
    };
  }

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Imbue Aura of Protection", max: "1", period: "lr" });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
