import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the shadows catch a creature that enters the square or
 * starts its turn there. A creature already blinded by them takes the damage with no save, and a
 * blinded creature can end it with a Dexterity or Wisdom save as an action; both are rolled by
 * hand from the same activity. The half cover the shadows give has no region form.
 */
export default class GrimShadows extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING,
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Enters the area for the first time on a turn or starts its turn there; an already blinded creature just takes the damage",
      }),
    ];
  }

}
