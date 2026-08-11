import DDBEnricherData from "../../data/DDBEnricherData";

export default class NightMusic extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Frightened",
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute; repeat the Charisma saving throw at the end of each turn, ending the effect on a success.",
        },
        statuses: ["Frightened"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Night Music (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=cha,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
