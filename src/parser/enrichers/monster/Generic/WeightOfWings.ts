import DDBEnricherData from "../../data/DDBEnricherData";
import { emanation } from "../../data/RegionBuilders";

/**
 * A swarm trait whose area is the swarm's own space: a creature that starts its turn there has
 * its Speed halved and saves against being Blinded. The parser already builds the save and the
 * Blinded effect; this gives the save an area and wires the region to it.
 *
 * dnd5e reads a template size of 0 as no size at all, so the space is a 1-foot emanation around
 * the swarm's footprint. A token sharing the swarm's space has its centre inside that; a token in
 * the next square has its centre 2.5 feet out and does not.
 *
 * The halved Speed rides on the save, linked to apply on a success as well as a failure, and not
 * on an effect the region applies while inside: the swarm always stands in its own space and that
 * behavior cannot skip the token the region comes from, so the swarm would halve its own Speed.
 * Both effects end once the creature ends a turn outside the space, which is left to the table,
 * as is the 24 hours of immunity a success gives.
 */
export default class WeightOfWings extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        target: emanation("1"),
        behaviors: [
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
        // the Speed is halved whether or not the creature saves
        onSave: true,
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 50)],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "Speed halved. Ends when the creature ends its turn outside the swarm's space.",
        },
      },
    ];
  }

}
