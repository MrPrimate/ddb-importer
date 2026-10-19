import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Reading the scroll spends it and surrounds the reader with a 5-foot barrier that moves with them
 * for 5 minutes. The DC 15 Charisma roll belongs to a creature trying to overcome the barrier, so
 * it is a free follow-up (a check in 2014, a save in 2024). The creature type stays a DM choice.
 */
export default class ScrollOfProtection extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Read Scroll",
      // the 2014 parse also builds DDB's overcome check, which keeps its own shape
      primaryOnly: true,
      activationType: "action",
      addItemConsume: true,
      data: {
        duration: { override: true, value: "5", units: "minute" },
        range: { override: true, units: "self", value: null },
        target: {
          override: true,
          template: { count: "1", contiguous: false, type: "radius", size: "5", units: "ft" },
          affects: { type: "self", count: "", choice: false, special: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      {
        init: { name: "Overcome Barrier", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          activationOverride: { type: "action", value: null, condition: "A creature within 5 feet of the barrier" },
          generateConsumption: false,
          generateSave: true,
          saveOverride: { ability: ["cha"], dc: { calculation: "", formula: "15" } },
          generateTarget: true,
          targetOverride: { affects: { type: "creature", count: "1" } },
          noeffect: true,
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

}
