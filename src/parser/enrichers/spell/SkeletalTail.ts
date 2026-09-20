import DDBEnricherData from "../data/DDBEnricherData";
import { MOVEMENT_EVENTS, castPlacer, emanation, ongoingAttack } from "./_SpellRegions";

const TAIL_STRIKE = "Tail Strike";

/**
 * Nothing is rolled as the spell is cast: the tail strikes as a Reaction when a creature moves
 * inside the 15-foot emanation. The region offers the attack once a turn to an enemy that moves
 * in or within it; whether the Reaction is spent is the caster's call, and the pull to an
 * adjacent space is moved by hand.
 */
export default class SkeletalTail extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: MOVEMENT_EVENTS,
        activityName: TAIL_STRIKE,
        excludeSelf: true,
      }),
    ], { target: emanation("15", "enemy") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingAttack({
        name: TAIL_STRIKE,
        activation: "reaction",
        condition: "A creature moves while in the emanation; on a hit it is pulled to a space adjacent to you",
      }),
    ];
  }

}
