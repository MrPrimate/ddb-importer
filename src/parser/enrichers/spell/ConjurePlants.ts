import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, area, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The plants are a Large mass the caster moves 30 feet a
 * turn, and they threaten every space within 5 feet, so the area is a 20-foot square dropped on
 * them that has to be dragged along when they move. DDB gives the spell no template.
 */
export default class ConjurePlants extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnEnd"],
        activityName: ONGOING,
      }),
    ], { target: area("square", "20") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Enters a space within 5 feet of the plants or ends its turn there, or the plants move within 5 feet of it (once per turn)",
      }),
    ];
  }

}
