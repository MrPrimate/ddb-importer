import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

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
      ...itemUses(this, "1"),
      retainActivityUseSpent: true,
      descriptionSuffix:
        "<p>The item remains on your sheet so its ongoing activity stays available. Before drinking another " +
        "potion from this stack, reduce the quantity by one for the previous drink and reset the item’s spent " +
        "uses to 0. Reset Breathe Fire’s spent uses to 0 when drinking the next potion. After the final " +
        "potion’s effect ends, remove the empty item manually.</p>",
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
