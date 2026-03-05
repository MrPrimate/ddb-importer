import DDBEnricherData from "../data/DDBEnricherData";

export default class Banishment extends DDBEnricherData {

  get activity(): IDDBActivityData {
    const originalName = this.ddbEnricher.originalActivity?.name ?? "";
    return {
      name: originalName === "" ? "Cast" : originalName,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Banishment Macro",
          type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateActivation: true,
          generateDDBMacro: true,
          noSpellslot: true,
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

  get effects(): IDDBEffectHint[] {
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
