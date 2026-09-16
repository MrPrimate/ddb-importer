import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { spellbookStudy } from "./_SpellbookStudy";

export default class AlchemicalCompendium extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Change Object",
      activationType: "action",
      activationCondition:
        "Touch an unattended nonmagical object; replacement value cannot increase. Change the object manually.",
      addItemConsume: true,
      addScalingMode: "amount",
      addConsumptionScalingMax: "min(3,@item.uses.value)",
      rangeType: "touch",
      overrideRange: true,
      overrideTarget: true,
      data: {
        target: {
          affects: { type: "object", count: "1" },
          template: { type: "cube", size: "1 + 2 * (@scaling - 1)", units: "ft" },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [spellbookStudy("transmutation")];
  }

}
