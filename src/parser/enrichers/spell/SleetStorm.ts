import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * A fixed 40-foot cylinder of icy difficult terrain. Neither printing rolls anything as the storm
 * appears: the cast only places it, and the region fires "Ongoing Save" (no damage; a failure
 * knocks the creature Prone) when a creature passes into it for the first time on a turn or starts
 * its turn there. Creating the storm on a creature is not entering (enterOn "movement", per the
 * 2014 design intent for this timing, which the 2024 wording keeps). The concentration save for a
 * concentrating creature is left to the table.
 */
export default class SleetStorm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["ice"] }),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING,
        enterOn: "movement",
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [ongoingTrigger({
      condition: "Enters the area for the first time on a turn or starts its turn there",
      noDamage: true,
    })];
  }

}
