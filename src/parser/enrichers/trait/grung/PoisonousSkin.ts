import DDBEnricherData from "../../data/DDBEnricherData";

export default class PoisonousSkin extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 60,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Poisonous Skin (End of Turn Save),turn=end,saveDC=12,saveAbility=con,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
