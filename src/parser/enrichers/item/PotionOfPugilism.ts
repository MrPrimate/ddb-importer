import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";
import { ACTIVE_CONSUMABLE_OVERRIDE, activeConsumableDrink, activeConsumableEffects } from "./_ActiveConsumable";
import utils from "../../../lib/Utils";

/**
 * Drinking is a self-enchantment lasting the potion's 10 minutes (see _ActiveConsumable). Its rider
 * is the extra force damage, so it only appears while a potion is active.
 */
export default class PotionOfPugilism extends DDBEnricherData {

  static DAMAGE_ID = utils.namedIDStub("Extra Force Damage", { prefix: "ddbItem" });

  static EFFECT_ID = "ddbPugilismEffct";

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return activeConsumableDrink({
      activationType: "bonus",
      duration: { value: "10", units: "minute" },
    });
  }

  override get override(): IDDBOverrideData {
    return ACTIVE_CONSUMABLE_OVERRIDE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Extra Force Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        activationCondition: "When an Unarmed Strike hits, while the potion is active",
        targetType: "creature",
        targetCount: "1",
        rangeType: "any",
        data: {
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "force" })],
          },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return activeConsumableEffects({
      name: "Potion of Pugilism",
      endName: "End Pugilism",
      effectId: PotionOfPugilism.EFFECT_ID,
      description: "Your Unarmed Strikes deal an extra 1d6 Force damage on a hit until the potion ends after 10 minutes.",
      activityRiders: [PotionOfPugilism.DAMAGE_ID],
    });
  }

}
