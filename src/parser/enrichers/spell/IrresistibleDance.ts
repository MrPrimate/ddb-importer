import DDBEnricherData from "../data/DDBEnricherData";

export default class IrresistibleDance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: this.is2014,
        },
        overrides: {
          data: {
            activation: {
              override: this.is2014,
              type: "special",
            },
          },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  get effects2014(): IDDBEffectHint[] {
    return [
      {
        name: "Comic Dancing",
        activityMatch: "Cast",
        macroChanges: [
          { macroType: "spell", macroName: "irresistibleDance.js" },
        ],
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("dex"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
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

  get effects2024(): IDDBEffectHint[] {
    return [
      {
        name: "Comic Dancing",
        options: {
          expiry: "targetEnd",
        },
      },
      {
        name: `Comic Dancing and Charmed`,
        options: {
          durationSeconds: 60,
        },
        macroChanges: [
          { macroType: "spell", macroName: "irresistibleDance.js" },
        ],
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("dex"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
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

  override get effects(): IDDBEffectHint[] {
    return this.is2014 ? this.effects2014 : this.effects2024;
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "irresistibleDance.js",
    };
  }

}
