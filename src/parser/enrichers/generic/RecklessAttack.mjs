/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class RecklessAttack extends DDBEnricherData {

  get activity() {
    return {
      activationType: "special",
      targetType: "self",
      rangeSelf: true,
      data: {
        duration: {
          units: "turn",
          value: 1,
        },
      },
    };
  }

  get effects() {
    const allMWAK = false;
    const key = allMWAK ? "flags.midi-qol.advantage.attack.mwak" : "flags.midi-qol.advantage.attack.str";
    return [
      {
        name: "Attacking Recklessly",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, key),
        ],
        daeStackable: "noneName",
      },
      {
        name: "Defending Recklessly",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
        daeStackable: "noneName",
        options: {
          duration: {
            seconds: 12,
            rounds: 2,
          },
        },
        daeSpecialDurations: [
          "turnStartSource",
        ],
      },
    ];
  }
}
