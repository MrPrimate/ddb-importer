import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";

/**
 * World of Warcraft (Demon Hunter): the 2d8 Fire save, then at the start of the target's next turn
 * it and each creature in its 10-foot Emanation save against 1d8 Fire (no damage on a success).
 */
export default class SigilOfFlame extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      splitDamage: true,
      data: {
        target: {
          override: true,
          affects: { count: "1", type: "creature" },
          template: { contiguous: false, type: "", size: "", units: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      followUpDamage({
        name: "Radiating Heat",
        parts: [1],
        save: "con",
        onSave: "none",
        condition: "At the start of the target's next turn: the target and each creature within 10 feet of it",
        template: { type: "radius", size: "10" },
      }),
    ];
  }

}
