import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { spellbookStudy } from "./_SpellbookStudy";

export default class AstromancyArchive extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Alter Roll",
      activationType: "reaction",
      addItemConsume: true,
      noTemplate: true,
      targetType: "creature",
      targetCount: "1",
      rangeType: "ft",
      rangeValue: 30,
      overrideRange: true,
      activationCondition:
        "After seeing an attack, check or save but before its effects; apply the d4 as a bonus or penalty manually",
      data: { roll: { formula: "1d4", prompt: false, visible: true, name: "Bonus or Penalty" } },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [spellbookStudy("divination")];
  }

}
