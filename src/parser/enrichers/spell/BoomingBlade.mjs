/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BoomingBlade extends DDBEnricherData {

  get type() {
    return this.useMidiAutomations ? "utility" : "none";
  }

  get activity() {
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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Extra Attack Damage",
          type: "damage",
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
          noeffect: true,
          overrideRange: {
            value: "5",
            units: "ft",
          },
          overrideTarget: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "", condition: "Creature moves more than 5 ft" },
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
          },
        },
      },
      {
        constructor: {
          name: "Movement Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, type: "thunder" })],
          noeffect: true,
          overrideRange: {
            value: "5",
            units: "ft",
          },
          overrideTarget: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "", condition: "Creature moves more than 5 ft" },
        },
        overrides: {
          overrideTemplate: true,
          noTemplate: true,
          data: {
            id: "ddb-boom-move-dam",
          },
        },
      },
    ];
  }

  get effects() {
    return [{
      name: "Booming Blade: Sheaved in Booming Energy",
      options: {
        description: `If the target willingly moves 5 feet or more before then, [[/item ${this.data.name} activity="Movement Damage"]](it takes thunder damage), and the spell ends.`,
      },
      midiNever: true,
    }];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "boomingBlade.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "boomingBlade.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

}
