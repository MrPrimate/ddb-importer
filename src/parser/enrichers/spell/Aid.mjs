/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Aid extends DDBEnricherData {

  get activity() {
    const originalName = this.ddbEnricher.originalActivity?.name ?? "";
    return {
      name: originalName === "" ? "Cast" : originalName,
    };
  }

  get effects() {
    const noMidiEffects = [2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
      return {
        name: `Aid: Level ${level} Max HP Bonus`,
        daeNever: true,
        activityMatch: "Cast",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${5 * (level - 1)}`, 20, "system.attributes.hp.bonuses.overall"),
        ],
      };
    });

    const midiEffects = [
      {
        name: "Aid: Max HP Bonus",
        daeOnly: true,
        daeChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("5 * (@spellLevel - 1)", 20, "system.attributes.hp.bonuses.overall"),
        ],
        macroChanges: [
          { macroValues: "@spellLevel", macroType: "spell", macroName: "aid.js", priority: 0 },
        ],
      },
    ];

    return [...noMidiEffects, ...midiEffects];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "aid.js",
    };
  }

}
