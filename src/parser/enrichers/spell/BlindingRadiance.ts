import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, emanation, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. DDB records the area as a sphere, so it is restated as a
 * 10-foot emanation to follow the caster, and it fires the save at a creature that moves within
 * 10 feet or starts its turn there.
 */
export default class BlindingRadiance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING,
        excludeSelf: true,
      }),
    ], { target: emanation("10") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Moves within 10 feet of the caster for the first time on its turn or starts its turn there",
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded",
        activityMatch: ONGOING,
        statuses: ["Blinded"],
        options: {
          transfer: false,
          expiry: "targetStart",
          description: "Blinded until the start of its next turn.",
        },
      },
    ];
  }

}
