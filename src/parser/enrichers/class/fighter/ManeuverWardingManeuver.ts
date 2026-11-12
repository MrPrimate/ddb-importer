import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

/**
 * Warding Maneuver (World of Warcraft Battle Master maneuver): a Reaction when you or a creature
 * within 5 feet is hit, wielding a Melee weapon or Shield; the Superiority Die is added to the
 * target's AC against that attack, and if it still hits the target resists its damage.
 */
export default class ManeuverWardingManeuver extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "reaction",
      activationCondition: "You or a creature within 5 feet of you is hit by an attack roll",
      data: {
        roll: { prompt: false, visible: false, formula: this.diceString, name: "AC Bonus" },
        range: { units: "ft", value: "5" },
        target: { override: true, affects: { count: "1", type: "creature" } },
        // one effect per rolled result: Midi prompts for the one rolled rather than applying all twelve
        midiProperties: { chooseEffects: true },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return this.rolledAcEffects("Warding Maneuver", {
      description: "Against the triggering attack only; if it still hits, you have Resistance to its damage.",
    });
  }

}
