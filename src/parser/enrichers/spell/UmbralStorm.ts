import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the storm catches a creature that enters it or starts its
 * turn there. Moving the storm 30 feet is a Bonus Action that means dragging the region; the storm
 * moving onto a creature is not that creature entering it (enterOn "movement").
 */
export default class UmbralStorm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        enterOn: "movement",
        activityName: ONGOING,
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Starts its turn in the storm or enters it for the first time on its turn",
      }),
    ];
  }

}
