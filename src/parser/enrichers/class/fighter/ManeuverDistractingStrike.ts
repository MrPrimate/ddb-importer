import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverDistractingStrike extends Maneuver {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Distracting Strike",
        options: { expiry: "sourceStart" },
        daeSpecialDurations: ["isAttacked"],
        // the effect sits on the struck target, which grants the next attacker advantage; core
        // has no target-side mode, so this stays a midi grants flag
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }
}
