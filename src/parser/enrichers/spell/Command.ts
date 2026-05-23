import DDBEnricherData from "../data/DDBEnricherData";

export default class Command extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Command",
        macroChanges: [
          { macroType: "spell", macroName: "command.js" },
        ],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            units: "seconds",
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
