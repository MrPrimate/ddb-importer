/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RagingStormSea extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      type: "save",
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

  get effects() {
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

  get itemMacro() {
    return {
      type: "feat",
      name: "ragingStormSea.js",
    };
  }

}
