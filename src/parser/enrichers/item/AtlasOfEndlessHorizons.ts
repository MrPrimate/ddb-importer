import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { spellbookStudy } from "./_SpellbookStudy";

export default class AtlasOfEndlessHorizons extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Escape Attack",
      activationType: "reaction",
      addItemConsume: true,
      noTemplate: true,
      targetType: "self",
      rangeType: "ft",
      rangeValue: 10,
      overrideRange: true,
      activationCondition:
        "When hit: teleport to a visible unoccupied space. The attack misses if the destination is outside its reach or range.",
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [spellbookStudy("conjuration")];
  }

}
