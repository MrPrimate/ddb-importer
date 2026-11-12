import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class PotionOfFireBreath extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      activationType: this.is2014 ? "action" : "bonus",
      addItemConsume: true,
      noTemplate: true,
      rangeSelf: true,
      targetType: "self",
      data: { duration: { value: "1", units: "hour", concentration: false } },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      spendOwnQuantity: true,
      retainActivityUseSpent: true,
      descriptionSuffix:
        "<p>Each drink takes one potion from the stack, and the item stays on your sheet at quantity 0 so " +
        "Breathe Fire stays available after the last one. Reset Breathe Fire’s spent uses to 0 when " +
        "drinking the next potion.</p>",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Breathe Fire", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        activationType: "bonus",
        activationCondition: "After drinking; expires after three breaths or 1 hour",
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

}
