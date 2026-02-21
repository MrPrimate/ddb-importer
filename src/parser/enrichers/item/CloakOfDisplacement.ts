import DDBEnricherData from "../data/DDBEnricherData";

export default class CloakOfDisplacement extends DDBEnricherData {

  get effects() {
    return [
      {
        name: `${this.data.name} - Check`,
        macroChanges: [
          { macroType: "item", macroName: "cloakOfDisplacement.js" },
        ],
        data: {
          "flags.dae.macroRepeat": "startEveryTurn",
        },
      },
    ];
  }

  get itemMacro() {
    return {
      type: "item",
      name: "cloakOfDisplacement.js",
    };
  }

}
