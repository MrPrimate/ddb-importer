import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverFalconsGlide extends DDBEnricherData {

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Falcon's Glide: Slow Fall", "Falcon's Glide: Fly"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Slow Fall",
      activationType: "reaction",
      activationCondition: "You fall",
      targetType: "self",
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Falcon's Glide: Fly",
        activityMatch: "Fly (1 Additional Point)",
        options: {
          description: "You have a fly speed of 30 feet until the end of the turn.",
          // "until the end of the turn" - a self buff spent on your own turn
          expiry: "sourceEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.speeds.fly"),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Fly (1 Additional Point)",
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
          activationCondition: "While gliding",
        },
      },
    ];
  }

}
