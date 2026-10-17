import DDBEnricherData from "../../data/DDBEnricherData";

export default class AspectOfTheWilds extends DDBEnricherData {

  // the options are modelled on this feature, so DDB's options are not built as documents
  override get noChoiceBuild(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      name: "Owl",
      // the choice is made, or changed, when you finish a Long Rest
      activationType: "longRest",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Panther",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "longRest",
          },
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
      {
        init: {
          name: "Salmon",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "longRest",
          },
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Owl",
        options: {
        },
        activityMatch: "Owl",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.senses.ranges.darkvision"),
        ],
      },
      {
        name: "Panther",
        options: {
        },
        activityMatch: "Panther",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.climb"),
        ],
      },
      {
        name: "Salmon",
        options: {
        },
        activityMatch: "Salmon",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.swim"),
        ],
      },
    ];
  }

}
