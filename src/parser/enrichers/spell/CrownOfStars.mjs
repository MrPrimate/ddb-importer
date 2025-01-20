/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class CrownOfStars extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast Spell",
      targetType: "self",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-7",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          geneateActivation: true,
          noSpellslot: true,
          generateRange: true,
          generateConsumption: true,
          noeffect: true,
        },
        overrides: {
          addItemConsume: true,
          activationType: "bonus",
          noeffect: true,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 4,
                  denomination: 12,
                  types: ["radiant"],
                  scalingNumber: "-2",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "A Crown of Stars",
        activityMatch: "Cast Spell",
        option: {
          description: "Star-like motes of light orbit your head",
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '60'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '30'),
        ],
        macroChange: [
          { macroType: "spell", macroName: "crownOfStars.js" },
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "crownOfStars.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

  get override() {
    return {
      data: {
        system: {
          uses: {
            spent: "11",
            max: "11",
            recovery: [],
          },
        },
      },
    };
  }

  get itemMacro() {
    return {
      name: "crownOfStars.js",
      type: "spell",
    };
  }

}
