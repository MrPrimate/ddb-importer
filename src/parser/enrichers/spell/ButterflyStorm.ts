import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the cloud is difficult terrain, and it is leaving it
 * that calls for the save, so the region fires on exit. The caster can spare creatures that were
 * inside at the cast, which is left to the table.
 */
export default class ButterflyStorm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain(),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenExit"],
        activityName: "Pulled Back Save",
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Pulled Back Save",
        condition: "Attempts to leave the cloud: on a failure it is pulled back to the space nearest the center",
        noDamage: true,
      }),
    ];
  }

}
