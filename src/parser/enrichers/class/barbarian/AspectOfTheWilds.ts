import DDBEnricherData from "../../data/DDBEnricherData";

export default class AspectOfTheWilds extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      name: "Owl",
      activationType: "special",
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Owl",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.ADD, 60, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
        options: {
        },
        activityMatch: "Owl",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.senses.darkvision"),
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
