/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Aid extends DDBEnricherData {

  get type() {
    if (this.useMidiAutomations) return "utility";
    return "heal";
  }

  get activity() {
    return {
      name: "Cast",
      stopHealSpellActivity: !this.useMidiAutomations,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "5",
          types: ["healing"],
          scalingMode: "whole",
          scalingFormula: "5",
        }),
      },
    };
  }

  get effects() {
    const noMidiEffects = [2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
      return {
        name: `Aid: Level ${level} Max HP Bonus`,
        notMidi: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${5 * (level - 1)}`, 20, "system.attributes.hp.tempmax"),
        ],
      };
    });

    const midiEffects = [
      {
        name: "Aid: Max HP Bonus",
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("5 * (@spellLevel - 1)", 20, "system.attributes.hp.tempmax"),
        ],
        macroChanges: [
          { macroValues: "@spellLevel", macroType: "spell", macroName: "aid.js", priority: 0 },
        ],
      },
    ];

    return [...noMidiEffects, ...midiEffects];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "aid.js",
    };
  }

}
