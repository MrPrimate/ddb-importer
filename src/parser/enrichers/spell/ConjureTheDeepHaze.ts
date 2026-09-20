import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the haze catches a creature that enters it or starts its
 * turn there. Contamination is a Drakkenheim track with no status in dnd5e, so both the level the
 * caster takes and the one a failed save gives are recorded by hand.
 */
export default class ConjureTheDeepHaze extends DDBEnricherData {

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
        condition: "Enters the haze for the first time on a turn or starts its turn there; a failure also gives one level of contamination",
      }),
    ];
  }

}
