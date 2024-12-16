/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class CrossbowExpert extends DDBEnricherData {

  get effects() {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.ignoreNearbyFoes"),
        ],
      },
    ];
  }

}
