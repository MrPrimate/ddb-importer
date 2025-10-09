/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SneakAttack extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Sneak Attack Damage",
      targetType: "creature",
      activationType: "special",
      noeffect: true,
      addItemConsume: true,
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
          critical: { allow: true },
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.rogue.sneak-attack",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Sneak Attack (Automation)",
        options: {
          transfer: true,
          durationSeconds: null,
          durationRounds: null,
        },
        midiOnly: true,
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "sneakAttack.js", document: this.data },
        ],
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
      },
    ];
  }

  get itemMacro() {
    return this.is2014
      ? {
        type: "feat",
        name: "sneakAttack.js",
      }
      : null;
  }

  get override() {
    return {
      data: {
        "system.uses": {
          "spent": 1,
          "recovery": [
            {
              "period": "turn",
              "type": "recoverAll",
            },
          ],
          "max": "1",
        },
      },
    };
  }
}
