import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverBaitAndSwitch extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "creature",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
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

  override get effects(): IDDBEffectHint[] {
    return this.rolledAcEffects("Bait and Switch", { expiry: "sourceStart" });
  }

}
