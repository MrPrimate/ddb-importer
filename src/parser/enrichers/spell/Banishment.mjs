/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Banishment extends DDBEnricherData {

  get activity() {
    const originalName = this.ddbEnricher.originalActivity?.name ?? "";
    return {
      name: originalName === "" ? "Cast" : originalName,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Banishment Macro",
          type: "ddbmacro",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateActivation: true,
          generateDDBMacro: true,
          noSpellSlot: true,
          ddbMacroOverride: {
            name: "Banish!",
            function: "ddb.spell.banishment",
            visible: false,
          },
        },
        overrides: {
          activationType: "special",
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Banished",
        statuses: ["Incapacitated"],
        options: {
          durationSeconds: 60,
        },
      },
      {
        noCreate: true,
        midiOnly: true,
        macroChanges: [
          { macroType: "spell", macroName: "banishment.js", priority: 0 },
        ],
      },
    ];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "banishment.js",
    };
  }

}
