/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FleshToStone extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Save (no spellslot)",
          activationType: "special",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
        },
      },
    ];
  }

  get clearAutoEffects() {
    return this.useMidiAutomations;
  }


  get effects() {
    return [
      {
        name: "Flesh to Stone (Automation)",
        activityMatch: "Cast",
        midiOnly: true,
        statuses: ["Restrained"],
        macroChanges: [
          { macroType: "spell", macroName: "fleshToStone.js" },
        ],
        options: {
          durationSeconds: 60,
        },
        data: {
          flags: {
            dae: {
              specialDurations: [],
              macroRepeat: "endEveryTurn",
            },
          },
        },
      },
    ];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "fleshToStone.js",
    };
  }

}
