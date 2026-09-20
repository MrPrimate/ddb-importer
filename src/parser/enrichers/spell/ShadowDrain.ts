import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The 15-foot emanation follows the caster and fires the
 * save at a creature that enters it or starts its turn there, never at the caster. The rules let
 * the caster name creatures it spares, which a region cannot ask, so it fires for enemies.
 */
export default class ShadowDrain extends DDBEnricherData {

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
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Enters the emanation or starts its turn there (once per turn)",
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
        name: "Shadow Drain: Drained",
        activityMatch: ONGOING,
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAttackChange(),
          DDBEnricherData.ChangeHelper.allChecksRollModeChange(DDBEnricherData.ChangeHelper.DISADVANTAGE),
        ],
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Disadvantage on attack rolls and ability checks until the end of its next turn.",
        },
      },
    ];
  }

}
