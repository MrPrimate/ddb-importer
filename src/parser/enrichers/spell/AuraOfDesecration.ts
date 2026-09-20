import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The 30-foot aura follows the caster and fires the save at
 * a creature that enters it or starts its turn there.
 * It harms creatures of the caster's choice, which a region cannot ask, so it fires for enemies.
 */
export default class AuraOfDesecration extends DDBEnricherData {

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
        condition: "Enters the aura for the first time on a turn or starts its turn there",
        affects: "enemy",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Desecrated",
        activityMatch: ONGOING,
        options: {
          transfer: false,
          expiry: "targetStart",
          description: "Can't regain Hit Points until the start of its next turn.",
        },
      },
    ];
  }

}
