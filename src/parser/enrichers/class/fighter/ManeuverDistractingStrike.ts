import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverDistractingStrike extends Maneuver {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Distracting Strike",
        options: { expiry: "sourceStart" },
        daeSpecialDurations: ["isAttacked"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      },
    ];
  }
}
