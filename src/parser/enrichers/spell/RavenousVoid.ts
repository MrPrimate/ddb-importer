import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, ongoingTrigger } from "./_SpellRegions";

const ONGOING_DAMAGE = "Ongoing Damage";

/**
 * A 20-foot sphere of destructive gravity, difficult terrain. Nothing is rolled as the sphere
 * appears: the cast only places it, and the region fires "Ongoing Damage" (DDB's force damage, no
 * save) when a creature passes into it for the first time on a turn or starts its turn there.
 * Creating the sphere on a creature is not entering (enterOn "movement"). DDB's Strength save is
 * the pull on a creature that starts its turn within 100 feet, offered as "Pull Save" for the table
 * to use; the pull itself, the restrained condition inside the sphere and objects being drawn in
 * are left to the table.
 */
export default class RavenousVoid extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain(),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING_DAMAGE,
        enterOn: "movement",
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: ONGOING_DAMAGE,
        noSave: true,
        condition: "Enters the sphere for the first time on a turn or starts its turn there",
      }),
      ongoingTrigger({
        name: "Pull Save",
        noDamage: true,
        condition: "Starts its turn within 100 feet of the sphere",
      }),
    ];
  }

}
