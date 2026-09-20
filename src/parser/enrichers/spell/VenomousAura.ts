import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, emanation, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled at all: a creature that starts its turn within 10 feet is Poisoned until its
 * next turn, even if it then leaves, so the region fires a free activity that applies the effect
 * where an effect held only while inside would drop it early. DDB records the area as a sphere,
 * so it is restated as a 10-foot emanation to follow the caster.
 */
export default class VenomousAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnStart"],
        activityName: "Venomous Aura: Poison",
        excludeSelf: true,
      }),
    ], { target: emanation("10") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Venomous Aura: Poison",
        condition: "Starts its turn within 10 feet of the caster",
        noSave: true,
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
        name: "Poisoned",
        activityMatch: "Venomous Aura: Poison",
        statuses: ["Poisoned"],
        options: {
          transfer: false,
          expiry: "targetStart",
          description: "Poisoned until the start of its next turn.",
        },
      },
    ];
  }

}
