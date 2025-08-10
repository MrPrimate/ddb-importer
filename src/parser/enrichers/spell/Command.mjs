/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Command extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Command",
        macroChanges: [
          { macroType: "spell", macroName: "command.js" },
        ],
        data: {
          duration: {
            seconds: 12,
            rounds: 1,
            turns: 1,
          },
        },
        daeSpecialDurations: ["turnStart"],
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "command.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    if (this.is2014) return null;
    return {
      name: "command.js",
      type: "spell",
      triggerPoints: ["postSave"],
    };
  }

}
