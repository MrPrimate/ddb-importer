/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SneakAttack extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      noeffect: true,
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
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
    return {
      type: "feat",
      name: "sneakAttack.js",
    };
  }
}
