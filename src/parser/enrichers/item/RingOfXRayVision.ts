import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class RingOfXRayVision extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Gain X-Ray Vision",
      activationType: "action",
      noConsumeTargets: true,
      noTemplate: true,
      rangeSelf: true,
      targetType: "self",
      activationCondition: "See through qualifying materials within 30 feet for 1 minute; resolve vision manually",
      data: { duration: { value: "1", units: "minute", concentration: false } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Repeated Use Save", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        activationCondition:
          "Every use after the first before a Long Rest; on failure add one Exhaustion level manually",
        targetType: "self",
        data: { save: { ability: ["con"], dc: { calculation: "", formula: "15" } } },
      }),
    ];
  }

}
