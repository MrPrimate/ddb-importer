/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Contagion extends DDBEnricherData {

  get effects() {
    return [
      {
        macroChanges: [
          { macroType: "spell", macroName: "confusion.js" },
        ],
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
}
