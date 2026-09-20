import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the snow is difficult terrain and catches a creature that
 * enters it or begins its turn there. Creatures with Resistance or Immunity to Cold damage pass
 * automatically, and the caster can spare a few named creatures; both are left to the table.
 */
export default class Whiteout extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["snow"] }),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING,
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Begins its turn in the snow or enters it; automatic success with Resistance or Immunity to Cold damage",
        noDamage: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Whiteout: Exhaustion",
        activityMatch: ONGOING,
        options: {
          transfer: false,
          description: "Gains 1 Exhaustion level, which ends when the spell does. Raise the Exhaustion level by hand.",
        },
      },
    ];
  }

}
