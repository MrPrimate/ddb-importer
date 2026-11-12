import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";
import { ACTIVE_CONSUMABLE_OVERRIDE, activeConsumableDrink, activeConsumableEffects } from "./_ActiveConsumable";
import utils from "../../../lib/Utils";

/**
 * Drinking is a self-enchantment lasting the potion's hour (see _ActiveConsumable). Its rider is
 * Breathe Fire, so the breath only appears while a potion is active and each drink brings a fresh
 * copy with three unspent breaths.
 */
export default class PotionOfFireBreath extends DDBEnricherData {

  static BREATH_ID = utils.namedIDStub("Breathe Fire", { prefix: "ddbItem" });

  static EFFECT_ID = "ddbFireBreathEff";

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return activeConsumableDrink({
      activationType: this.is2014 ? "action" : "bonus",
      duration: { value: "1", units: "hour" },
    });
  }

  override get override(): IDDBOverrideData {
    return ACTIVE_CONSUMABLE_OVERRIDE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Breathe Fire", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        activationType: "bonus",
        activationCondition: "While the potion is active; it ends after three breaths or 1 hour",
        addActivityConsume: true,
        rangeType: "ft",
        rangeValue: 30,
        overrideRange: true,
        targetType: "creature",
        targetCount: "1",
        data: {
          uses: { max: "3", spent: 0, recovery: [] },
          save: { ability: ["dex"], dc: { calculation: "", formula: "13" } },
          damage: {
            includeBase: false,
            onSave: "half",
            parts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, type: "fire" })],
          },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return activeConsumableEffects({
      name: "Potion of Fire Breath",
      endName: "End Fire Breath",
      effectId: PotionOfFireBreath.EFFECT_ID,
      description: "You can exhale fire as a Bonus Action, up to three times, until the potion ends after 1 hour.",
      activityRiders: [PotionOfFireBreath.BREATH_ID],
    });
  }

}
