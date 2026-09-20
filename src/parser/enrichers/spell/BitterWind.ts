import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, area, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the line blasts from the caster and catches a creature
 * that starts its turn in it. Turning the line is a Bonus Action that means rotating the region.
 * Movement toward the caster costs double, which is directional and has no region form.
 */
export default class BitterWind extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnStart"],
        activityName: ONGOING,
        excludeSelf: true,
      }),
    ], { target: area("line", "120", { width: "20" }) });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Starts its turn in the line (Disadvantage in cold weather, in darkness, or when upcast)",
      }),
    ];
  }

}
