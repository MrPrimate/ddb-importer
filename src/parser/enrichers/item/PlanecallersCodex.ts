import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { spellbookStudy } from "./_SpellbookStudy";

export default class PlanecallersCodex extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Empower Summoned Creature",
      activationType: "special",
      addItemConsume: true,
      noTemplate: true,
      targetType: "creature",
      targetCount: "1",
      rangeType: "any",
      activationCondition: "When your conjuration spell summons or creates one creature",
      data: { duration: { value: "1", units: "minute", concentration: false } },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [spellbookStudy("conjuration")];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Planecalled",
        activityMatch: "Empower Summoned Creature",
        options: { durationSeconds: 60, transfer: false },
        changes: [DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack")],
      },
    ];
  }

}
