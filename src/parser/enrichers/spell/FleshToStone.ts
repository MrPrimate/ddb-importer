import DDBEnricherData from "../data/DDBEnricherData";

export default class FleshToStone extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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


  get effects(): IDDBEffectHint[] {
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
        daeSpecialDurations: [],
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
      type: "spell",
      name: "fleshToStone.js",
    };
  }

}
