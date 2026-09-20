import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

export default class BabaYagasPestle extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noConsumeTargets: true };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "12", [{ period: "dawn", type: "recoverAll" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Charge Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        allowCritical: true,
        activationCondition: "When you hit with a melee attack using the pestle",
        targetType: "creature",
        targetCount: "1",
        rangeType: "any",
        addItemConsume: true,
        addScalingMode: "amount",
        addConsumptionScalingMax: "min(3,@item.uses.value)",
        data: {
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, type: "force" })],
          },
        },
      }),
    ];
  }

}
