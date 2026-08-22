import DDBEnricherData from "../../data/DDBEnricherData";

export default class SlowingBreath extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Slowed",
        options: {
          durationSeconds: 60,
          description: "Speed halved and unable to use reactions. The target repeats the save at the end of each of its turns, ending the effect on a success.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
        midiChanges: this.is2014
          ? []
          : [
            DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.dex"),
          ],
      },
    ];
  }

}
