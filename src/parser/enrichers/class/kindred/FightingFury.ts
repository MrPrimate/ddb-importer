import DDBEnricherData from "../../data/DDBEnricherData";

export default class FightingFury extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Fighting Fury",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      data: {
        duration: { value: "1", units: "minute", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Fighting Fury: Swiftness",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          chatFlavor: "Take the Dash or Dodge action as a Bonus Action.",
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          useActivitySnippet: true,
        },
      },
    ];
  }

}
