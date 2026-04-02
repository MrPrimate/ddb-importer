import DDBEnricherData from "../../data/DDBEnricherData";

export default class AspectOfTheWilds extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      name: "Owl",
      activationType: "special",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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
            type: "special",
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
            type: "special",
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Owl",
        options: {
        },
        activityMatch: "Owl",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.senses.ranges.darkvision"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", "add", 60, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", "override", "darkvision", 5),
        ],
      },
      {
        name: "Panther",
        options: {
        },
        activityMatch: "Panther",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
        ],
      },
      {
        name: "Salmon",
        options: {
        },
        activityMatch: "Salmon",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.swim"),
        ],
      },
    ];
  }

}
