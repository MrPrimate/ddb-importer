/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverDistractingStrike extends Maneuver {
  get effects() {
    return [
      {
        name: "Distracting Strike",
        daeSpecialDurations: ["isAttacked", "turnStartSource"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      },
    ];
  }
}
