import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverSlipperyOtter extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Slippery Otter: Activate", "Slippery Otter: Dash"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Embody Otter",
      activationType: "bonus",
      targetType: "self",
      data: {
        duration: {
          units: "hour",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Slippery Otter",
        activityMatch: "Embody Otter",
        options: {
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.swim"),
        ],
      },
    ];
  }

  // the in-water bonus action Dash is free for the duration
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Dash",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          generateConsumption: true,
        },
        overrides: {
          targetType: "self",
          activationType: "bonus",
          activationCondition: "While in the water",
          noConsumeTargets: true,
        },
      },
    ];
  }

}
