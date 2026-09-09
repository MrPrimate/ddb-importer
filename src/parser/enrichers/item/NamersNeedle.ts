import DDBEnricherData from "../data/DDBEnricherData";

export default class NamersNeedle extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Identify Target", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          saveOverride: { ability: ["wis"], dc: { calculation: "", formula: "15" } },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "When you hit a creature with this weapon",
          noConsumeTargets: true,
          noTemplate: true,
          data: { range: { units: "spec" } },
        },
      },
      {
        init: { name: "Named Target (Critical Hit)", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "When you hit and say the target's name; once per dawn",
          addItemConsume: true,
          noTemplate: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [{ period: "dawn", type: "recoverAll" }],
      },
    };
  }

}
