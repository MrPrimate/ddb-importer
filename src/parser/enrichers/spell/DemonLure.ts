import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Demon Lure (OTFY): a 150-foot Emanation around the totem that rolls nothing as it is cast. The
 * region fires "Ongoing Save" (Wisdom, Charmed for as long as the spell lasts) when a creature starts
 * its turn there. Only demons (Fiends) are affected and a success grants immunity for the duration,
 * both left to the table, as is the larger Emanation from a level 5+ slot (300, 500 or 1,000 feet);
 * resize the region by hand.
 */
export default class DemonLure extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      ...castPlacer([
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenTurnStart"],
          activityName: ONGOING,
        }),
      ], {
        // a point on the ground, not an area that follows the caster
        target: {
          override: true,
          affects: { type: "creature", count: "", choice: false, special: "" },
          template: { type: "sphere", size: "150", units: "ft", count: "", contiguous: false },
        },
      }),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [ongoingTrigger({
      condition: "A demon without Total Cover from the totem starts its turn in the Emanation: Charmed until the spell ends on a failure",
      // any demon, whatever its disposition: the lure has no friend or foe wording
      affects: "creature",
      noDamage: true,
      // the Charmed ends with the caster's concentration on the lure
      joinConcentration: true,
      // the Charmed it applies lasts as long as the spell
      keepSpellDuration: true,
    })];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Demon Lure: Charmed",
        activityMatch: ONGOING,
        statuses: ["Charmed"],
      },
    ];
  }

}
