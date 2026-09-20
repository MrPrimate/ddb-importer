import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, area, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The aura belongs to the chosen creature, not the caster,
 * and an emanation only attaches to the token that used the activity, so the area is a 20-foot
 * circle dropped on the target that has to be dragged along when it moves. DDB gives the spell no
 * template.
 */
export default class FestivalKing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING,
      }),
    ], { target: area("circle", "20") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Moves within 20 feet of the Festival King for the first time on a turn or starts its turn there; automatic success if it can't be charmed",
        noDamage: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Enamored with the Festival King",
        activityMatch: ONGOING,
        options: {
          transfer: false,
          description: "Spends its action and Bonus Action at the start of its turn admiring the Festival King. Ends if it starts its turn outside the aura.",
        },
      },
    ];
  }

}
