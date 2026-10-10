import DDBEnricherData from "../../data/DDBEnricherData";

/** Free League Messenger: a bonus action makes a Charisma check or takes the Help action (aiding an attack on a target up to 30 feet away). */
export default class WordsOfGuardAndGuiding extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Charisma Check",
      targetType: "self",
      activationType: "bonus",
      data: {
        check: { associated: [], ability: "cha", dc: { calculation: "", formula: "" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Help", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: { type: "bonus", value: 1, condition: "An ally attacking a creature within 30 feet of you can hear and understand you" },
        },
        overrides: { targetType: "ally", noConsumeTargets: true },
      },
    ];
  }

}
