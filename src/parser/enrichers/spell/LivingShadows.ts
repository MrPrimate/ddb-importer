import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The shadows fire a Strength save at a creature that
 * enters them or starts its turn there. A creature that starts its turn already Restrained makes
 * a Constitution save against Exhaustion instead, which a region cannot tell apart, so that one
 * is a free roll made by hand.
 */
export default class LivingShadows extends DDBEnricherData {

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
        condition: "Starts its turn in the shadows or enters them for the first time on its turn",
        noDamage: true,
      }),
      ongoingTrigger({
        name: "Exhaustion Save",
        condition: "Starts its turn Restrained by the shadows",
        noDamage: true,
        saveAbility: "con",
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        activityMatch: ONGOING,
        statuses: ["Restrained"],
        options: {
          transfer: false,
          description: "Restrained by the shadows. A Strength or Dexterity check against the spell save DC, as an action, frees it.",
        },
      },
      {
        name: "Living Shadows: Exhaustion",
        activityMatch: "Exhaustion Save",
        options: { transfer: false, description: "Gains 1 Exhaustion level. Raise the Exhaustion level by hand." },
      },
    ];
  }

}
