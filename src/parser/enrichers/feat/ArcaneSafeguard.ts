import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneSafeguard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bonus Action Resistance",
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      data: { range: { value: "0", units: "touch" } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Sheltering Aid",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: { type: "action", value: null, condition: "When you take the Help action" },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["temphp"] }),
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "ally",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "@prof",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
