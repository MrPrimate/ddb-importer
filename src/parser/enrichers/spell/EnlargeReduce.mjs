/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class EnlargeReduce extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Enlarged",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d4", 20, "system.bonuses.mwak.damage"),
        ],
        atlNever: true,
      },
      {
        name: "Reduced",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.bonuses.mwak.damage"),
        ],
        atlNever: true,
      },
      {
        name: "Enlarged/Reduced",
        atlOnly: true,
        options: {
          durationSeconds: 60,
        },
        macroChanges: [
          { macroType: "spell", macroName: "enlargeReduce.js", priority: 0 },
        ],
      },
    ];
  }

  get itemMacro() {
    return {
      name: "enlargeReduce.js",
      type: "spell",
    };
  }

}
