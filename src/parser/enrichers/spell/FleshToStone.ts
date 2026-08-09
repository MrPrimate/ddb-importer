import DDBEnricherData from "../data/DDBEnricherData";

export default class FleshToStone extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get clearAutoEffects(): boolean {
    return this.useMidiAutomations;
  }


  override get effects(): IDDBEffectHint[] {
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

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "fleshToStone.js",
    };
  }

}
