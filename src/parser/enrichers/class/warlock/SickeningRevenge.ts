import DDBEnricherData from "../../data/DDBEnricherData";

export default class SickeningRevenge extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Sickening Revenge: Poisoned",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 60,
          description: "Poisoned for 1 minute; repeats the Constitution save at the end of each of its turns, ending the condition on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Sickening Revenge (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
