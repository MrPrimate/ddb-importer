import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

const ENTRY = "Entry Save";

/**
 * Warding Barrier (OTFY), a 15-foot-radius Sphere that rolls nothing as it is cast. The region fires
 * "Entry Save" (Charisma, Prone and blocked for the turn) when a creature moves into it, and
 * "Ongoing Save" (Charisma, shunted outside, Prone and 2d8 Force) when one starts its turn there.
 * Placing the ward on a creature is not entering (enterOn "movement"). Only the chosen creature type
 * at or under the Challenge Rating limit (2, +1 per slot level above 2) is affected, which is left
 * to the table, as are the block and the shunt.
 */
export default class WardingBarrier extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      ...castPlacer([
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter"],
          activityName: ENTRY,
          enterOn: "movement",
        }),
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenTurnStart"],
          activityName: ONGOING,
        }),
      ], {
        // DDB records the Sphere without a size
        target: {
          override: true,
          affects: { type: "creature", count: "", choice: false, special: "" },
          template: { type: "sphere", size: "15", units: "ft", count: "", contiguous: false },
        },
      }),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: ENTRY,
        condition: "A creature of the chosen type (CR limit) attempts to move into the area: Prone and can't enter this turn on a failure",
        noDamage: true,
      }),
      ongoingTrigger({
        condition: "A creature of the chosen type (CR limit) starts its turn in the area: shunted outside, Prone and 2d8 Force on a failure",
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Warding Barrier: Prone",
        activitiesMatch: [ENTRY, ONGOING],
        statuses: ["Prone"],
      },
    ];
  }

}
