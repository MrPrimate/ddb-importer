import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The smite's damage is part of the hit, so it is never halved and can crit; the Wisdom save only
 * decides Frightened. The cast stays the save activity so the condition rides on the activity that
 * holds the slot, its upcast dice and the concentration.
 */
export default class WrathfulSmite extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      allowCritical: true,
      data: {
        damage: { onSave: "full" },
      },
    };
  }

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
