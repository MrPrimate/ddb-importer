import DDBEnricherData from "../data/DDBEnricherData";

export default class BlindnessDeafness extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Blindness",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Deafness",
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    const midiChanges = [
      DDBEnricherData.ChangeHelper.overrideChange(
        `label=${this.data.name} (End of Turn),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveMagic=true,killAnim=true`,
        20,
        "flags.midi-qol.OverTime",
      ),
    ];
    return [
      {
        name: "Blindness",
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("0", 99, "ATL.sight.range"),
        ],
        activityMatch: "Blindness",
        statuses: ["Blinded"],
        midiChanges,
        options: {
          durationSeconds: 60,
          durationRounds: 10,
        },
      },
      {
        name: "Deafness",
        activityMatch: "Deafness",
        statuses: ["Deafened"],
        midiChanges,
        options: {
          durationSeconds: 60,
          durationRounds: 10,
        },
      },
    ];
  }

}
