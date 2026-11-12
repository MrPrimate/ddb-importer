import DDBEnricherData from "../data/DDBEnricherData";
import { ACTIVE_CONSUMABLE_OVERRIDE, activeConsumableDrink, activeConsumableEffects } from "./_ActiveConsumable";

/**
 * The first damage-dealing spell of 4th level or lower cast within a minute of drinking uses the
 * highest number on each die. Drinking is a self-enchantment lasting that minute (see
 * _ActiveConsumable), and its rider is the macro activity that works out the maximum from a recent
 * spell, so it only appears while a potion is active.
 */
export default class PotionOfMaximumPower extends DDBEnricherData {

  static MACRO_ID = "ddbItemMaxPowMac";

  static EFFECT_ID = "ddbMaxPowerEffct";

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return activeConsumableDrink({
      activationType: "action",
      duration: { value: "1", units: "minute" },
    });
  }

  override get override(): IDDBOverrideData {
    return ACTIVE_CONSUMABLE_OVERRIDE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [DDBEnricherData.maximumDamageActivity({
      id: PotionOfMaximumPower.MACRO_ID,
      condition: "The first damage-dealing spell of 4th level or lower you cast while the potion is active",
      parameters: {
        title: "Potion of Maximum Power",
        sources: [{ type: "spell" }],
        maxSpellLevel: 4,
      },
    })];
  }

  override get effects(): IDDBEffectHint[] {
    return activeConsumableEffects({
      name: "Potion of Maximum Power",
      endName: "End Maximum Power",
      effectId: PotionOfMaximumPower.EFFECT_ID,
      description: "The first damage-dealing spell of 4th level or lower you cast before the potion ends after 1 minute deals maximum damage.",
      activityRiders: [PotionOfMaximumPower.MACRO_ID],
    });
  }

}
