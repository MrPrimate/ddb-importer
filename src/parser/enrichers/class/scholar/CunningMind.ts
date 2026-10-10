import DDBEnricherData from "../../data/DDBEnricherData";

/** Free League Scholar: in combat a bonus action each turn can make an Intelligence or Wisdom check, or take the Help action. */
export default class CunningMind extends DDBEnricherData {

  static check(name: string, ability: string): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        generateCheck: true,
        activationOverride: { type: "bonus", value: 1, condition: "" },
        checkOverride: { associated: [], ability, dc: { calculation: "", formula: "" } },
      },
      overrides: { targetSelf: true, noConsumeTargets: true },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Intelligence Check",
      targetType: "self",
      activationType: "bonus",
      data: {
        check: { associated: [], ability: "int", dc: { calculation: "", formula: "" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      CunningMind.check("Wisdom Check", "wis"),
      {
        init: { name: "Help", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: { generateConsumption: false, generateTarget: true, generateActivation: true, activationOverride: { type: "bonus", value: 1, condition: "" } },
        overrides: { targetType: "ally", noConsumeTargets: true },
      },
    ];
  }

}
