import DDBEnricherData from "../data/DDBEnricherData";

export default class Command extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "command.js",
    };
  }

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag | null {
    if (this.is2014) return null;
    return {
      name: "command.js",
      type: "spell",
      triggerPoints: ["postSave"],
    };
  }

}
