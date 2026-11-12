import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

/**
 * Demoralizing Shout (World of Warcraft Battle Master maneuver): a Bonus Action shout; until the end
 * of your next turn each enemy within 30 feet that hears it subtracts the Superiority Die from its
 * next melee hit's damage against a target other than you.
 */
export default class ManeuverDemoralizingShout extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "bonus",
      data: {
        roll: { prompt: false, visible: true, formula: this.diceString, name: "Damage Reduction" },
        range: { units: "self" },
        target: {
          override: true,
          affects: { type: "enemy" },
          template: { contiguous: false, type: "radius", size: "30", units: "ft" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Demoralized",
        options: {
          transfer: false,
          expiry: "sourceEnd",
          description: "Subtract the rolled Superiority Die from the damage roll the next time you hit a target other than the warrior with a melee attack.",
        },
      },
    ];
  }

}
