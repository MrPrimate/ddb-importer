import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

/**
 * Heroic Leap (World of Warcraft Battle Master maneuver): a Bonus Action jump up to your Strength
 * score in feet; creatures within 5 feet of where you land make a Strength save against the
 * maneuver DC, taking the Superiority Die in Bludgeoning damage, half on a success. DDB ships one
 * save per DC ability and a fixed d12.
 */
export default class ManeuverHeroicLeap extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "bonus",
      data: {
        range: { units: "self" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, type: "radius", size: "5", units: "ft" },
        },
        save: {
          ability: ["str"],
          dc: { calculation: "", formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)" },
        },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ customFormula: this.diceString, types: ["bludgeoning"] })],
        },
      },
    };
  }

}
