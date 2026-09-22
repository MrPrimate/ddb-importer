import DDBEnricherData from "../data/DDBEnricherData";
import { area, castPlacer, ongoingAttack } from "./_SpellAreas";

const LEAF_ATTACK = "Leaf Attack";

/**
 * Nothing is rolled as the spell is cast. The shrub fills one space and threatens every space
 * within 10 feet, so its area is a 25-foot square dropped on it, and a hostile creature that
 * moves in or starts its turn there is offered the shrub's attack. The same attack is the Bonus
 * Action one; several shrubs near one target add their dice to a single roll by hand.
 */
export default class ForestGuard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer({ target: area("square", "25", {}, "enemy") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingAttack({
        name: LEAF_ATTACK,
        condition: "A hostile creature moves within 10 feet of the shrub for the first time on a turn or starts its turn there; also a Bonus Action on your turn",
      }),
    ];
  }

}
