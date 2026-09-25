import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";
import { spellbookStudy } from "./_SpellbookStudy";

export default class ProtectiveVerses extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Protective Ward",
      activationType: "special",
      activationCondition: "When you cast an abjuration spell; choose one creature you can see",
      addItemConsume: true,
      targetType: "creature",
      targetCount: "1",
      rangeType: "ft",
      rangeValue: 30,
      overrideRange: true,
      noTemplate: true,
      data: { healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, type: "temphp" }) },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      spellbookStudy("abjuration"),
      itemActivity("Lock Book", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        activationCondition: "Touch the cover to lock it as with Arcane Lock",
        targetType: "object",
        targetCount: "1",
        rangeType: "touch",
      }),
    ];
  }

}
