import DDBEnricherData from "../../data/DDBEnricherData";
import Generic from "../Generic";

export default class BeguilingTwist extends Generic {

  override get clearAutoEffects(): boolean {
    // Preserve the effect cloned from the same-named action on the feature;
    // clearing here runs after activity cloning and leaves dangling links.
    return this.isAction;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Charmed",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Charmed"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Beguiling Twist (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Frightened",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Frightened"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Beguiling Twist (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
