import DDBEnricherData from "../../data/DDBEnricherData";
import Generic from "../Generic";

export default class GrandfatherParadox extends Generic {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stunned",
        options: {
          durationSeconds: 60,
          description: "Locked between opposing timelines. The creature repeats the Intelligence saving throw at the end of each of its turns, ending the effect on itself on a success.",
        },
        statuses: ["Stunned"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "turn=end,label=Grandfather Paradox (End of Turn),saveRemove=true,saveDC=@attributes.spell.dc,saveAbility=int,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
