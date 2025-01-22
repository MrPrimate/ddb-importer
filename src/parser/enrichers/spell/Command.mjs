/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Command extends DDBEnricherData {

  get activity() {
    return {
      lookupName: {
        "Activate Mantle of Majesty": {
          data: {
            name: "Activate Mantle of Majesty",
          },
        },
      },
    };
  }

  get additionalActivities() {
    if (this.useLookupName && this.ddbParser.lookupName === "Activate Mantle of Majesty") {
      return [
        {
          constructor: {
            name: "Free Cast",
            type: "save",
          },
          build: {
            noSpellslot: true,
            generateConsumption: true,
            generateSave: true,
          },
        },
      ];
    }
    return [];
  }

  get override() {
    return {
      lookupName: {
        "Activate Mantle of Majesty": {
          data: {
            "flags.ddbimporter": {
              ignoredConsumptionActivities: ["Free Cast"],
              // spellSlot: true,
            },
          },
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Command",
        macroChanges: [
          { macroType: "spell", macroName: "command.js" },
        ],
        data: {
          duration: {
            seconds: 12,
            rounds: 1,
            turns: 1,
          },
        },
        daeSpecialDurations: ["turnStart"],
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "command.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    if (this.is2014) return null;
    return {
      name: "command.js",
      type: "spell",
      triggerPoints: ["postSave"],
    };
  }

}
