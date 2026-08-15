import DDBEnricherData from "../../data/DDBEnricherData";

export default class MagicResistance extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        name: "Magic Resistance",
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 5, "flags.midi-qol.magicResistance.all"),
        ],
      },
      {
        options: {
          transfer: true,
        },
        name: "Magic Resistance",
        ac5eOnly: true,
        midiNever: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "isSpell || isMagical",
            20,
            "flags.automated-conditions-5e.save.advantage",
          ),
        ],
      },
    ];
  }

}
