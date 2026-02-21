import DDBEnricherData from "../../data/DDBEnricherData";

export default class PotentCantrip extends DDBEnricherData {
  get effect() {
    return [
      {
        name: "Potent Cantrip (Automation)",
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "1",
            20,
            "flags.midi-qol.potentCantrip",
          ),
        ],
      },
    ];
  }
}
