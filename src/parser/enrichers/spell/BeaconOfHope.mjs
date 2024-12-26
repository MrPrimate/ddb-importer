/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BeaconOfHope extends DDBEnricherData {

  get effects() {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.advantage.ability.save.wis"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.advantage.deathSave"),
        ],
      },
    ];
  }

}
