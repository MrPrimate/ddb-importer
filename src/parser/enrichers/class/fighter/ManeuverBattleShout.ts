import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

/**
 * Battle Shout (World of Warcraft Battle Master maneuver): a Bonus Action shout; until the start of
 * your next turn each ally within 30 feet that hears it adds the Superiority Die to its next melee
 * hit's damage. The die is rolled here, since an ally's own roll data has no Superiority Die.
 */
export default class ManeuverBattleShout extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "bonus",
      data: {
        roll: { prompt: false, visible: true, formula: this.diceString, name: "Bonus Damage" },
        range: { units: "self" },
        target: {
          override: true,
          affects: { type: "ally" },
          template: { contiguous: false, type: "radius", size: "30", units: "ft" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Battle Shout",
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Add the rolled Superiority Die to the damage roll the next time you hit with a melee attack.",
        },
      },
    ];
  }

}
