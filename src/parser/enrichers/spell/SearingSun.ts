import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the cylinder burns a creature that starts its turn in
 * it. Moving the area 20 feet is an action that means dragging the region.
 */
export default class SearingSun extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({ events: ["tokenTurnStart"], activityName: ONGOING }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({ condition: "Starts its turn in the sunlight (Advantage if shaded by a solid object)" }),
    ];
  }

}
