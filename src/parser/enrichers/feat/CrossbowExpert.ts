import DDBEnricherData from "../data/DDBEnricherData";

export default class CrossbowExpert extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
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
