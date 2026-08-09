import DDBEnricherData from "../data/DDBEnricherData";

export default class CloakOfDisplacement extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: `${this.data.name} - Check`,
        macroChanges: [
          { macroType: "item", macroName: "cloakOfDisplacement.js" },
        ],
        data: {
          flags: {
            dae: {
              macroRepeat: "startEveryTurn",
            },
          },
        },
      },
    ];
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "item",
      name: "cloakOfDisplacement.js",
    };
  }

}
