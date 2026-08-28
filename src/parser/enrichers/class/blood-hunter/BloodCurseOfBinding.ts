import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfBinding extends _BloodCurse {

  override get curseName(): string {
    return "Blood Curse of Binding";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      useActivitySnippet: true,
      targetType: "creature",
      targetCount: 1,
      activationCondition: "Large or smaller creature",
      // the DDB action carries the Blood Curses die scale as a damage part
      removeDamageParts: true,
      data: {
        save: {
          ability: ["str"],
          dc: this.hemocraftSaveDC,
        },
        damage: {
          onSave: "none",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          activationCondition: `${_BloodCurse.AMPLIFY_CONDITION}. Any size of creature.`,
          removeDamageParts: true,
        },
      },
      this.amplifyCostActivity,
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // until the end of the caster's next turn
        name: "Bound",
        activityMatch: this.curseName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "Your speed is 0 and you can't use reactions.",
        },
        daeSpecialDurations: ["turnEndSource"],
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 20),
        ],
      },
      {
        // amplified: lasts 1 minute, with a save at the end of each turn
        name: "Bound (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 60,
          description: "Your speed is 0 and you can't use reactions. You can repeat the saving throw at the end of each of your turns, ending the curse on a success.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 20),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=Blood Curse of Binding (End of Turn Save),turn=end,saveDC=${this.hemocraftSaveDCFormula},saveAbility=str,savingThrow=true,saveRemove=true,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
