/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PotentCantrip extends DDBEnricherData {
  get effect() {
    return [
      {
        name: "Potent Cantrip Automation",
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
