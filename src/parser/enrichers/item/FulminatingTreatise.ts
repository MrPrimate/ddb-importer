import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";
import { spellbookStudy } from "./_SpellbookStudy";

export default class FulminatingTreatise extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Fulminating Blast",
      activationType: "reaction",
      addItemConsume: true,
      noTemplate: true,
      targetType: "creature",
      targetCount: "1",
      rangeType: "any",
      removeDamageParts: true,
      activationCondition: "When a creature you can see takes damage from your evocation spell",
      damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, type: "force" })],
      data: { damage: { includeBase: false } },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      spellbookStudy("evocation"),
      itemActivity("Knock Prone", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        noeffect: false,
        targetType: "creature",
        targetCount: "1",
        rangeType: "any",
        activationCondition: "Only the Large or smaller creature damaged by Fulminating Blast",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Knocked Prone",
        statuses: ["Prone"],
        activityMatch: "Knock Prone",
        options: { transfer: false, durationSeconds: null },
      },
    ];
  }

}
