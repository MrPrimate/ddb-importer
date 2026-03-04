import DDBEnricherData from "../data/DDBEnricherData";

export default class PsychicScream extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            "label=Psychic Scream Stun (End of Turn),turn=end,saveDC=@attributes.spell.dc,saveAbility=int,saveMagic=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
