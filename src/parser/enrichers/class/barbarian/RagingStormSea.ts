import DDBEnricherData from "../../data/DDBEnricherData";

export default class RagingStormSea extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "creature",
      rangeSelf: true,
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        target: {
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        statuses: ["Prone"],
      },
      {
        name: "Raging Seas Storm (Automation)",
        midiOnly: true,
        options: {
          transfer: true,
        },
        optionalMacroChanges: [
          { optionPostfix: "ragingSea.damage.mwak", macroType: "feat", macroName: "ragingStormSea.js", document: this.data },
          { optionPostfix: "ragingSea.damage.msak", macroType: "feat", macroName: "ragingStormSea.js", document: this.data },
          { optionPostfix: "ragingSea.damage.rwak", macroType: "feat", macroName: "ragingStormSea.js", document: this.data },
          { optionPostfix: "ragingSea.damage.rsak", macroType: "feat", macroName: "ragingStormSea.js", document: this.data },
        ],
        midiOptionalChanges: [
          {
            name: "ragingSea",
            data: {
              count: "reaction",
              label: "Use your reaction to induce a save to apply prone?",
            },
          },
        ],
      },
    ];
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "ragingStormSea.js",
    };
  }

}
