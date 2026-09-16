import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

export default class PotionOfPugilism extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      activationType: "bonus",
      addItemConsume: true,
      noTemplate: true,
      rangeSelf: true,
      targetType: "self",
      data: { duration: { value: "10", units: "minute", concentration: false } },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      ...itemUses(this, "1"),
      descriptionSuffix:
        "<p>The item remains on your sheet so its ongoing activity stays available. Before drinking another " +
        "potion from this stack, reduce the quantity by one for the previous drink and reset the item’s spent " +
        "uses to 0. After the final potion’s effect ends, remove the empty item manually.</p>",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Extra Force Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        activationCondition: "When an Unarmed Strike hits, within 10 minutes after drinking",
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

}
