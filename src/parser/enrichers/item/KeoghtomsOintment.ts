import DDBEnricherData from "../data/DDBEnricherData";
import { quantityUses, determineQuantity } from "./_ItemQuantity";

export default class KeoghtomsOintment extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Use Ointment",
      activationType: "action",
      addItemConsume: true,
      rangeType: "ft",
      rangeValue: 5,
      overrideRange: true,
      targetType: "creature",
      targetCount: "1",
      noTemplate: true,
      activationCondition: this.is2014
        ? "Also removes poison and cures disease"
        : "Also removes the Poisoned condition",
      data: { healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, bonus: "2", type: "healing" }) },
    };
  }

  override get override(): IDDBOverrideData {
    return quantityUses(this, 5);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [determineQuantity("Determine Doses", "1d4 + 1")];
  }

}
