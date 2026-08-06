import DDBEnricherData from "../../data/DDBEnricherData";

export default class HagsVisageHorrifyingGaze extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hag's Visage: Frightened",
        activityMatch: "Hag's Visage: Horrifying Gaze",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute; repeats the Wisdom save at the end of each of its turns, ending the effect on itself on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Horrifying Gaze (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
