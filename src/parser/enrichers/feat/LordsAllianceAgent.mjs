/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class LordsAllianceAgent extends DDBEnricherData {

  get activity() {
    return {
      name: "Reassert Honor",
      activationType: "special",
      targetType: "enemy",
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Reassert Honor: Advantage Mark",
        daeSpecialDurations: ["1Attack"],
        data: {
          duration: {
            turns: 1,
          },
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      },
    ];
  }

}
