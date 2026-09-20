import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

/**
 * Haint Hooch: insubstantial for 1 minute; with Heightened Potency the drinker also gains a fly
 * speed equal to their speed, so that is a separate effect to apply when it applies.
 */
export default class HaintHooch extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      targetType: "self",
      rangeSelf: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Ending Turn Inside an Object", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        activationCondition: "You end your turn inside an object while insubstantial",
        data: {
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, type: "force" })],
          },
        },
      }, { generateDamage: true }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Insubstantial",
        activityMatch: "Drink",
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "You can move through creatures and objects as if they were Difficult Terrain, taking 1d10 Force damage if you end your turn inside an object.",
        },
      },
      {
        name: "Heightened Potency: Flight",
        activityMatch: "Drink",
        options: {
          transfer: false,
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
