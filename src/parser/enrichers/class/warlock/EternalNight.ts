import DDBEnricherData from "../../data/DDBEnricherData";

export default class EternalNight extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Eternal Night: Immortal Vigor",
        options: {
          durationSeconds: 60,
          description: "At the start of each of your turns, regain 1d6 Hit Points if you have at least 1 Hit Point and you aren't in direct sunlight or running water. Drain Life deals an extra 1d8 Necrotic damage without expending a spell slot.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Eternal Night (Start of Turn Regeneration),turn=start,savingThrow=false,damageRoll=1d6,damageType=healing,condition=@attributes.hp.value > 0,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
