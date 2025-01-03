/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ArmorOfAgathys extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Cast Spell",
      targetType: "self",
      targetOverride: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "5",
          types: ["temphp"],
          scalingMode: "whole",
          scalingFormula: 5,
        }),
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({ bonus: "5", type: "cold", scalingFormula: "5", scalingMode: "whole" }),
          ],
          noeffect: true,
        },
      },
    ];
  }

  get effects() {
    // {
    //   "key": "flags.midi-qol.onUseMacroName",
    //   "mode": 0,
    //   "value": "ItemMacro, isHit",
    //   "priority": 20
    // },
    // {
    //   "key": "flags.midi-qol.onUseMacroName",
    //   "mode": 0,
    //   "value": "ItemMacro, isDamaged",
    //   "priority": 20
    // }
    return [
      {
        onUseMacroChanges: [
          { macroPass: "isHit", macroType: "spell", macroName: "armorOfAgathys.js", document: this.data },
          { macroPass: "isDamaged", macroType: "spell", macroName: "armorOfAgathys.js", document: this.data },
        ],
        data: {
          flags: {
            dae: {
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "armorOfAgathys.js",
    };
  }

}
