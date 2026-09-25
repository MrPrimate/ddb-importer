import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class CauldronOfRebirth extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Potion",
      activationType: this.is2014 ? "special" : "minute",
      activationValue: 1,
      activationCondition:
        "After a Long Rest; create a Potion of Greater Healing manually. It loses its magic after 24 hours.",
      noConsumeTargets: true,
      addActivityConsume: true,
      noTemplate: true,
      targetType: "object",
      targetCount: "1",
      rangeSelf: true,
      data: { uses: { max: "1", spent: 0, recovery: [{ period: "lr", type: "recoverAll" }] } },
    };
  }

  override get override(): IDDBOverrideData {
    return { retainActivityUseSpent: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Resize Cauldron", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        targetType: "object",
        targetCount: "1",
        activationCondition: "Grow to hold a Medium creature, or shrink; move displaced contents manually",
      }),
      itemActivity("Raise Dead", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "hour",
        activationValue: 8,
        addActivityConsume: true,
        targetType: "creature",
        targetCount: "1",
        rangeType: "touch",
        activationCondition:
          "A Humanoid corpse and 200 pounds of salt for at least 8 hours; return to life next dawn. Reset this use manually after 7 days.",
        data: { uses: { max: "1", spent: 0, recovery: [] } },
      }),
    ];
  }

}
