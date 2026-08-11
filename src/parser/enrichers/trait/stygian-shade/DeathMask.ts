import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeathMask extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get clearAutoEffects(): boolean {
    // action side only: clears the auto "Status: Frightened" duplicate. On the
    // trait the wipe runs AFTER the action clone (addAdditionalActivities
    // precedes _addEffects) and would orphan the activity's linked effect.
    return this.isAction;
  }

  override get effects(): IDDBEffectHint[] {
    // the same-named DDB action also loads this enricher and its effect is
    // cloned onto the trait with the activity - skip the trait-side copy
    if (!this.isAction) return [];
    return [
      {
        name: "Frightened",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
          description: "Repeat the Wisdom saving throw at the end of each of your turns, ending the effect on a success. Success grants immunity for 24 hours.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Death Mask (End of Turn Save),turn=end,saveDC=13,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
