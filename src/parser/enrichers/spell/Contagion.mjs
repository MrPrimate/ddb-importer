/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Contagion extends DDBEnricherData {

  get activity() {
    return {
      id: this.ddbEnricher?._originalActivity?.type === "save" ? "ddbContagionSave" : "ddbContagionCast",
      name: this.ddbEnricher?._originalActivity?.type === "save" ? "Save" : "Cast",
    };
  }

  get clearAutoEffects() {
    return this.useMidiAutomations && this.is2014;
  }

  get effects() {
    return [
      {
        activityMatch: this.is2014 ? "Cast" : "Save",
        noCreate: !this.clearAutoEffects,
        name: this.useMidiAutomations ? "Contagion" : "Contagion: Poisoned",
        macroChanges: [
          { macroType: "spell", macroName: this.is2014 ? "contagion2014.js" : "contagion2024.js" },
        ],
        options: {
          durationSeconds: 604800,
        },
        data: {
          flags: {
            dae: {
              macroRepeat: "endEveryTurn",
            },
          },
        },
      },
    ];
  }

  get itemMacro() {
    return {
      name: this.is2014 ? "contagion2014.js" : "contagion2024.js",
      type: "spell",
    };
  }

  // get override() {
  //   if (this.is2014) return null;
  //   return {
  //     data: {
  //       flags: {
  //         "midi-qol": {
  //           effectCondition: "true",
  //         },
  //       },
  //     },
  //   };
  // }

  get setMidiOnUseMacroFlag() {
    if (this.is2014) return null;
    return {
      name: "contagion2024.js",
      type: "spell",
      triggerPoints: ["postActiveEffects"],
    };
  }
}
