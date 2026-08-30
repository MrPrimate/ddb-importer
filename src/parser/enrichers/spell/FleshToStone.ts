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
    const effects: IDDBEffectHint[] = [];
    if (!this.is2014) {
      effects.push({
        name: "Unable to Move",
        activityMatch: "Cast",
        onSave: true,
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 20),
        ],
        options: { expiry: "sourceStart" },
      });
    }
    effects.push(
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
          expiry: "turnStart",
        },
        data: {
          flags: {
            dae: {
              macroRepeat: "endEveryTurn",
            },
          },
        },
      },
    );
    return effects;
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "fleshToStone.js",
    };
  }

}
