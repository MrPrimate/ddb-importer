import DDBEnricherData from "../data/DDBEnricherData";

export default class WrathfulSmite extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    // 2024: the frightened target repeats the save at the end of each of its
    // turns; 2014: it can use an action to make a Wisdom check against the DC.
    const overTime = this.is2014
      ? "turn=end,rollType=check,actionSave=true,saveAbility=wis,saveDC=@attributes.spell.dc,label=Wrathful Smite (Action Check),killAnim=true"
      : "label=Wrathful Smite (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true";
    return [
      {
        // merge into the auto-generated Frightened effect rather than
        // creating a second one
        noCreate: true,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(overTime, 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
  }

}
