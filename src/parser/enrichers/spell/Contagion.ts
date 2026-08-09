import DDBEnricherData from "../data/DDBEnricherData";

export default class Contagion extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: this.ddbEnricher?._originalActivity?.type === "save" ? "ddbContagionSave" : "ddbContagionCast",
      name: this.ddbEnricher?._originalActivity?.type === "save" ? "Save" : "Cast",
    };
  }

  override get clearAutoEffects() {
    return this.useMidiAutomations && this.is2014;
  }

  override get effects(): IDDBEffectHint[] {
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

  override get itemMacro(): IDDBItemMacro {
    return {
      name: this.is2014 ? "contagion2014.js" : "contagion2024.js",
      type: "spell",
    };
  }

  // get override(): IDDBOverrideData {
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

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag | null {
    if (this.is2014) return null;
    return {
      name: "contagion2024.js",
      type: "spell",
      triggerPoints: ["postActiveEffects"],
    };
  }
}
