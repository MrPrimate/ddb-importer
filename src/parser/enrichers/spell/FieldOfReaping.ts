import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. A hostile creature in the field is cursed until the end
 * of its next turn, even if it leaves, so the region fires a free activity that applies the curse
 * where an effect held only while inside would drop it early; use that same activity on hostile
 * creatures already in the field at the cast. DDB's damage part is what a cursed creature takes
 * the first time it is damaged on a turn, which is rolled by hand, as is the healing it feeds.
 */
export default class FieldOfReaping extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnEnd"],
        activityName: "Reaping Curse",
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Reaping Curse",
        condition: "A Hostile creature is in the field as it appears, enters it for the first time on a turn or ends its turn there",
        affects: "enemy",
        noSave: true,
        noDamage: true,
      }),
      ongoingTrigger({
        name: "Reaped Life Force",
        condition: "The first time a cursed creature takes damage during a turn; a creature of your choice in the field regains that many Hit Points",
        noSave: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cursed (Field of Reaping)",
        activityMatch: "Reaping Curse",
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Until the end of its next turn, the first time it takes damage during a turn it takes the spell's extra Necrotic damage.",
        },
      },
    ];
  }

}
