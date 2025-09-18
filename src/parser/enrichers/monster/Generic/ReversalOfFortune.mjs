/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ReversalOfFortune extends DDBEnricherData {

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
        options: {
          duration: {
            turns: 1,
          },
        },
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "system.traits.dm.midi.all"),
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
