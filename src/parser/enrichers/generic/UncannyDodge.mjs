/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class UncannyDodge extends DDBEnricherData {

  get type() {
    return "utility";
  }


  get activity() {
    return {
      activationType: "reaction",
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.uncanny-dodge"),
        ],
        daeSpecialDurations: [
          "1Reaction",
        ],
      },
    ];
  }

  get override() {
    return {
      midiDamageReaction: true,
    };
  }

}
