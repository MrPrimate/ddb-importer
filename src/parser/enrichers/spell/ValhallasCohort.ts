import DDBEnricherData from "../data/DDBEnricherData";
import { area, castPlacer, ongoingAttack } from "./_SpellAreas";

const COHORT_ATTACK = "Cohort Attack";

/**
 * Nothing is rolled as the spell is cast. The cohort is a Huge mass the caster moves 30 feet a
 * turn, and it strikes at creatures within 5 feet, so the area is a 25-foot square dropped on it
 * that has to be dragged along when it moves. A creature moving in is offered the attack; the
 * cohort ending its own move beside one is the caster's turn, so that attack is used by hand.
 */
export default class ValhallasCohort extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer({ target: area("square", "25", {}, "enemy") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingAttack({
        name: COHORT_ATTACK,
        condition: "A creature moves within 5 feet of the cohort, or the cohort ends its move within 5 feet of it (once per turn)",
      }),
    ];
  }

}
