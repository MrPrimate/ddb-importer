import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

const TWISTED: TCreatureTypes[] = ["aberration", "fey", "fiend", "monstrosity", "undead"];

/**
 * Nothing is rolled as the spell is cast. The ward only touches five creature types: while one is
 * inside it has Disadvantage on ability checks and attack rolls, and it saves against fear when it
 * enters or starts its turn there. Both arms carry the same type filter.
 */
export default class CrookedWard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Crooked Ward: Agony", types: TWISTED }),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING,
        types: TWISTED,
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "An Aberration, Fey, Fiend, Monstrosity or Undead enters the ward for the first time on a turn or starts its turn there",
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
        name: "Crooked Ward: Agony",
        standalone: true,
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAttackChange(),
          DDBEnricherData.ChangeHelper.allChecksRollModeChange(DDBEnricherData.ChangeHelper.DISADVANTAGE),
        ],
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null, description: "Disadvantage on ability checks and attack rolls while in the ward." },
      },
      {
        name: "Frightened",
        activityMatch: ONGOING,
        statuses: ["Frightened"],
        options: { transfer: false, expiry: "targetStart", description: "Frightened until the start of its next turn." },
      },
    ];
  }

}
