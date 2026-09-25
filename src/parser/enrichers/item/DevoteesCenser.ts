import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

export default class DevoteesCenser extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return { noConsumeTargets: true };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "1", [{ period: "dawn", type: "recoverAll" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Light Incense", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        addItemConsume: true,
        noTemplate: false,
        targetType: "creature",
        overrideTarget: true,
        data: {
          duration: { value: "1", units: "minute", concentration: false },
          target: { affects: { type: "creature", count: "" }, template: { type: "radius", size: "10", units: "ft" } },
        },
      }),
      itemActivity("Incense Healing", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
        activationType: "turnStart",
        activationCondition: "At the start of your turn while the incense lasts; includes you",
        targetType: "creature",
        rangeType: "ft",
        rangeValue: 10,
        overrideRange: true,
        data: { healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, type: "healing" }) },
      }),
    ];
  }

}
