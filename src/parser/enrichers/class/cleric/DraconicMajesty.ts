import DDBEnricherData from "../../data/DDBEnricherData";
import Generic from "../Generic";

export default class DraconicMajesty extends Generic {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charmed",
        options: {
          durationSeconds: 60,
          description: "Charmed by draconic authority. The creature repeats the Wisdom saving throw at the end of each of its turns, ending the effect on itself on a success.",
        },
        statuses: ["Charmed"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "turn=end,label=Draconic Majesty (End of Turn),saveRemove=true,saveDC=@attributes.spell.dc,saveAbility=wis,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Frightened",
        options: {
          durationSeconds: 60,
          description: "Frightened by draconic authority. The creature repeats the Wisdom saving throw at the end of each of its turns, ending the effect on itself on a success.",
        },
        statuses: ["Frightened"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "turn=end,label=Draconic Majesty (End of Turn),saveRemove=true,saveDC=@attributes.spell.dc,saveAbility=wis,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
