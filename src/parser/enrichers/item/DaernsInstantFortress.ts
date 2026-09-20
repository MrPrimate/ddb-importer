import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class DaernsInstantFortress extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Grow Tower",
      activationType: "action",
      noConsumeTargets: true,
      activationCondition:
        "Place on the ground; the tower is 30 feet high. Move displaced creatures and objects manually.",
      overrideTarget: true,
      rangeType: "touch",
      overrideRange: true,
      data: {
        duration: { units: "perm", concentration: false },
        target: {
          affects: { type: this.is2014 ? "creatureOrObject" : "object", count: "" },
          template: { type: "cube", size: "20", units: "ft" },
        },
        ...(this.is2014
          ? {
            save: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
            damage: {
              includeBase: false,
              onSave: "half",
              parts: [DDBEnricherData.basicDamagePart({ number: 10, denomination: 10, type: "bludgeoning" })],
            },
          }
          : {}),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Dismiss Tower", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        targetType: "object",
        activationCondition: "Only while the tower is empty",
      }),
      itemActivity("Open Fortress Door", DDBEnricherData.ACTIVITY_TYPES.UTILITY, { activationType: "bonus", targetType: "object" }),
    ];
  }

}
