/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SquireOfSolamniaPreciseStrike extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
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
        midiOnly: true,
        options: {
          transfer: false,
        },
        macroChanges: [
          { macroValues: `${this.data.name}`, macroType: "feat", macroName: "squireOfSolamnia.js" },
        ],
        onUseMacroChanges: [
          { macroPass: "postAttackRoll", macroType: "feat", macroName: "squireOfSolamnia.js", document: this.data },
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.mwak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.rwak"),
        ],
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "squireOfSolamnia.js", document: this.data },
        ],
        daeSpecialDurations: ["1Attack"],
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

  get itemMacro() {
    return {
      type: "feat",
      name: "squireOfSolamnia.js",
    };
  }

}
