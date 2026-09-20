import DDBEnricherData from "../../data/DDBEnricherData";
import { emanation } from "../../data/RegionBuilders";

/**
 * A swarm trait whose area is the swarm's own space: a creature that starts its turn there has
 * its Speed halved and saves against being Blinded. The parser already builds the save and the
 * Blinded effect; this gives the save an area and wires the region to it.
 *
 * dnd5e reads a template size of 0 as no size at all, so the space is a 1-foot emanation around
 * the swarm's footprint. A token sharing the swarm's space has its centre inside that; a token in
 * the next square has its centre 2.5 feet out and does not. Both effects end once the creature
 * ends a turn outside the space: the halved Speed is held only while inside, and ending the
 * Blinded condition is left to the table, as is the 24 hours of immunity a success gives.
 */
export default class WeightOfWings extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        target: emanation("1"),
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Weight of Wings: Speed Halved" }),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            // the swarm does not save against its own wings
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Weight of Wings: Speed Halved",
        standalone: true,
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 50)],
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null, description: "Speed halved while in the swarm's space." },
      },
    ];
  }

}
