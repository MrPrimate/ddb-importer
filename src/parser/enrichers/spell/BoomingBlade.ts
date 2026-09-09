import DDBEnricherData from "../data/DDBEnricherData";

export default class BoomingBlade extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.useMidiAutomations ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Spell (Automation)",
      targetType: "creature",
      overrideTemplate: true,
      overrideRange: true,
      noTemplate: true,
      data: {
        range: {
          override: true,
          units: "ft",
          value: "5",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Extra Attack Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({
            type: "thunder",
            scalingMode: "whole",
            scalingFormula: "1d8",
          })],
          // noeffect: true,
          rangeOverride: {
            value: "5",
            units: "ft",
          },
          targetOverride: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "special", condition: "Creature moves more than 5 ft" },
        },
        overrides: {
          overrideTemplate: true,
          noTemplate: true,
          data: {
            range: {
              override: true,
              value: 5,
              units: "ft",
            },
            damage: {
              critical: {
                allow: true,
              },
            },
          },
        },
      },
      {
        init: {
          name: "Movement Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, type: "thunder" })],
          noeffect: true,
          rangeOverride: {
            value: "5",
            units: "ft",
          },
          targetOverride: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "special", condition: "Creature moves more than 5 ft" },
        },
        overrides: {
          overrideTemplate: true,
          noTemplate: true,
          data: {
            _id: "ddbboommovedam01",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Booming Blade: Sheaved in Booming Energy",
      options: {
        description: `If the target willingly moves 5 feet or more before then, [[/item ${this.data.name} activity="Movement Damage"]](it takes thunder damage), and the spell ends.`,
      },
      midiNever: true,
    }];
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "boomingBlade.js",
    };
  }

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag {
    return {
      type: "spell",
      name: "boomingBlade.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

}
