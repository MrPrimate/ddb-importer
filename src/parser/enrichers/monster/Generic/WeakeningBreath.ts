import DDBEnricherData from "../../data/DDBEnricherData";

export default class WeakeningBreath extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Weakened",
        options: {
          durationSeconds: 60,
          description: "Disadvantage on Strength-based attack rolls, checks, and saving throws.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.str"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.check.str"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.str"),
        ],
      },
    ];
  }

}
