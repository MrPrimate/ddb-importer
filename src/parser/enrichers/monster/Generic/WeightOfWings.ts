import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * A swarm trait whose area is the swarm's own space: a creature that starts its turn there has
 * its Speed halved and saves against being Blinded. The parser already builds the save and the
 * Blinded effect; this adds the halved Speed beside it.
 *
 * The Speed is halved whether or not the creature saves, but effect links here carry no on-save
 * marker, so it is applied by hand after a success. Both effects end once the creature ends a
 * turn outside the space, which is left to the table, as is the 24 hours of immunity a success
 * gives.
 */
export default class WeightOfWings extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Weight of Wings: Speed Halved",
        changes: [DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all")],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "Speed halved, whether or not the save succeeds. Ends when the creature ends its turn outside the swarm's space.",
        },
      },
    ];
  }

}
