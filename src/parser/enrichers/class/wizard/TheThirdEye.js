/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class TheThirdEye extends DDBEnricherMixin {

  get type() {
    return "utility";
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
        constructor: {
          name: "Greater Comprehension",
          type: "utility",
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
        constructor: {
          name: "See Invisibility",
          type: "utility",
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

  get effects() {
    return [
      {
        name: "Darkvision",
        options: {
        },
        data: {
          "flags.ddbimporter.activityMatch": "Darkvision",
        },
        changes: [
          DDBEnricherMixin.generateUpgradeChange("120", 20, "system.attributes.senses.darkvision"),
        ],
        atlChanges: [
          DDBEnricherMixin.generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 120, 5),
          DDBEnricherMixin.generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
      },
      {
        name: "Greater Comprehension",
        options: {
        },
        data: {
          "flags.ddbimporter.activityMatch": "Greater Comprehension",
          description: "You can read any language",
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(";Read Any Language", 20, "system.traits.languages.special"),
        ],
      },
      {
        name: "See Invisibility",
        options: {
        },
        data: {
          "flags.ddbimporter.activityMatch": "See Invisibility",
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(";Invisible Creatures", 20, "system.attributes.senses.special"),
          DDBEnricherMixin.generateUnsignedAddChange(";Ethereal Plane", 20, "system.attributes.senses.special"),
        ],
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": {
          spent: 0,
          max: "1",
          recovery: [{ period: "sr", type: 'recoverAll', formula: undefined }],
        },
      },
    };
  }

}
