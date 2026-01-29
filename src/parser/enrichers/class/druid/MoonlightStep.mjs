/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MoonlightStep extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Transport",
      targetType: "self",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Moonlight Step: Advantage on Next Attack",
        options: {
          description: "You have Advantage on the next attack roll you make before the end of this turn.",
          durationTurns: 1,
        },
        daeSpecialDurations: ["1Attack"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      },
    ];
  }

}
