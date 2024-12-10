/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

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

}
