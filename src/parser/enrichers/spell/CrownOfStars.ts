import DDBEnricherData from "../data/DDBEnricherData";

export default class CrownOfStars extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Cast Spell",
      targetType: "self",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-7",
          scaling: {
            mode: "" as const,
            formula: "",
          },
        },
      ],
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
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
                  scalingNumber: -2,
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "A Crown of Stars",
        activityMatch: "Cast Spell",
        options: {
          description: "Star-like motes of light orbit your head",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#d5e2e6", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        ],
        macroChanges: [
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

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: "11",
            max: "11",
            recovery: [{ period: "sr", type: "loseAll", formula: "" }],
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
