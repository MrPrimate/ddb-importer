import DDBEnricherData from "../../data/DDBEnricherData";

export default class HolyNimbus extends DDBEnricherData {

  get activity() {
    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        data: {
          name: "Use/Apply Light",
        },
      };
    } else {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
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
        init: {
          name: "Aura Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@abilities.mod.cha + @prof", types: ["radiant"] })],
        },
      },
      {
        init: {
          name: "Spend Spell Slot to Restore Use",
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

  get effects() {
    const effects = [];
    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      effects.push({
        data: {
          "flags.ddbimporter.activityMatch": "Use/Apply Light",
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '@scale.paladin.aura-of-protection'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
        ],
      });
    }
    return effects;
  }

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Imbue Aura of Protection", max: "1", period: "lr" });
    return {
      uses,
    };
  }

}
