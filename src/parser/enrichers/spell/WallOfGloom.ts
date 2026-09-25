import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, ongoingTrigger } from "./_SpellAreas";

const WALL_SAVE = "Wall Save";
const NEARBY_SAVE = "Nearby Save";

/**
 * Nothing is rolled as the spell is cast. The wall itself drains a creature that enters it or
 * ends its turn there. The save for coming within 20 feet is a band around a wall, a shape no
 * template has, so it is a free save used by hand. The caster names the creatures the wall
 * spares, so both saves are offered against enemies.
 */
export default class WallOfGloom extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer();
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: WALL_SAVE,
        condition: "Enters the wall for the first time on a turn or ends its turn there",
        affects: "enemy",
        noDamage: true,
      }),
      ongoingTrigger({
        name: NEARBY_SAVE,
        condition: "Moves within 20 feet of the wall or starts its turn there",
        affects: "enemy",
        noDamage: true,
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wall of Gloom: Exhaustion",
        activityMatch: WALL_SAVE,
        options: { transfer: false, description: "Gains 1 Exhaustion level. Raise the Exhaustion level by hand." },
      },
      {
        name: "Incapacitated",
        activityMatch: NEARBY_SAVE,
        statuses: ["Incapacitated"],
        options: { transfer: false, durationSeconds: 6 },
      },
    ];
  }

}
