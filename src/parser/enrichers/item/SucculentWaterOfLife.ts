import DDBEnricherData from "../data/DDBEnricherData";

export default class SucculentWaterOfLife extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Succulent Water of Life",
        options: {
          durationSeconds: 60,
          description: "You regain 1d10 Hit Points at the start of each of your turns for 1 minute, provided you have at least 1 Hit Point.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Succulent Water of Life (Start of Turn Regeneration),turn=start,savingThrow=false,damageRoll=1d10,damageType=healing,condition=@attributes.hp.value > 0,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
