import DDBEnricherData from "../../data/DDBEnricherData";

export default class MythicSwashbuckler extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Mythic Swashbuckler",
      useActivitySnippet: true,
      activationType: "action",
      addItemConsume: true,
      data: {
        range: { value: "5", units: "ft", special: "" },
        duration: { value: "1", units: "minute", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Dash",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          activationOverride: { type: "bonus", value: 1, condition: "" },
          rangeOverride: { value: "5", units: "ft", special: "" },
        },
        overrides: {
          useActivitySnippet: true,
        },
      },
      {
        init: {
          name: "Disengage",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          activationOverride: { type: "bonus", value: 1, condition: "" },
          rangeOverride: { value: "5", units: "ft", special: "" },
        },
        overrides: {
          useActivitySnippet: true,
        },
      },
      {
        init: {
          name: "Swashbuckler Advantage",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          chatFlavor: "Advantage on attack rolls against that creature.",
          activationOverride: {
            type: "special",
            value: 1,
            condition: "When you are within 5 feet of a creature and no other creature is within 5 feet of you",
          },
          rangeOverride: { value: "5", units: "ft", special: "" },
        },
        overrides: {
          useActivitySnippet: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Mythic Swashbuckler",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
