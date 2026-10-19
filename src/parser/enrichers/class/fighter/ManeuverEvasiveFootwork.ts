import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverEvasiveFootwork extends Maneuver {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      // 2024: "As a Bonus Action ... take the Disengage action"; 2014: as you move
      activationType: this.is2014 ? "special" : "bonus",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: this.diceString,
          name: "AC Bonus",
        },
        // one effect per rolled result: Midi prompts for the one rolled rather than applying all twelve
        midiProperties: { chooseEffects: true },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return this.rolledAcEffects("Evasive Footwork", this.is2014 ? {} : { expiry: "sourceStart" });
  }

}
