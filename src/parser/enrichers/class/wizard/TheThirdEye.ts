import DDBEnricherData from "../../data/DDBEnricherData";

export default class TheThirdEye extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Darkvision",
      targetType: "self",
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Greater Comprehension",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
      {
        init: {
          name: "See Invisibility",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
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
        name: "Darkvision",
        activityMatch: "Darkvision",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.darkvision"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 120, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
      },
      {
        name: "Greater Comprehension",
        activityMatch: "Greater Comprehension",
        data: {
          description: "You can read any language",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(";Read Any Language", 20, "system.traits.languages.special"),
        ],
      },
      {
        name: "See Invisibility",
        activityMatch: "See Invisibility",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(";Invisible Creatures", 20, "system.attributes.senses.special"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(";Ethereal Plane", 20, "system.attributes.senses.special"),
        ],
      },
    ];
  }

  get override() {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll", formula: undefined }],
      },
    };
  }

}
