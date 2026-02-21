import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

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
