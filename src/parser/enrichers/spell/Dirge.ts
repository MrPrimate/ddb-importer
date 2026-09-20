import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, emanation, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The 60-foot emanation follows the caster, denies healing
 * to creatures while they are inside, and fires the save at one that enters it or ends its turn
 * there. The caster names the creatures it spares, which a region cannot ask, so both arms apply
 * to enemies. A success still halves Speed, which is left to the table; the Exhaustion DDB parses
 * belongs to the Circle casting only, so the automatic effects are replaced.
 */
export default class Dirge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Dirge: No Healing" }),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnEnd"],
        activityName: ONGOING,
        excludeSelf: true,
      }),
    ], { target: emanation("60", "enemy") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Enters the emanation or ends its turn there, or the emanation enters its space (once per turn); a success still halves its Speed",
        affects: "enemy",
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dirge: No Healing",
        standalone: true,
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null, description: "Can't regain Hit Points while in the emanation." },
      },
      {
        name: "Prone",
        activityMatch: ONGOING,
        statuses: ["Prone"],
        options: { transfer: false, description: "Cast as a Circle spell, a failure also gives 1 Exhaustion level." },
      },
    ];
  }

}
