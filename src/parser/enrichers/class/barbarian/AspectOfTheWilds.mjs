/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class AspectOfTheWilds extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      name: "Owl",
      activationType: "special",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Panther",
          type: "utility",
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
        constructor: {
          name: "Salmon",
          type: "utility",
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

  get effects() {
    return [
      {
        name: "Owl",
        options: {
        },
        activityMatch: "Owl",
        changes: [
          DDBEnricherMixin.generateUpgradeChange("60", 20, "system.attributes.senses.darkvision"),
        ],
        atlChanges: [
          DDBEnricherMixin.generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.ADD, 60, 5),
          DDBEnricherMixin.generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
      },
      {
        name: "Panther",
        options: {
        },
        activityMatch: "Panther",
        changes: [
          this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
        ],
      },
      {
        name: "Salmon",
        options: {
        },
        activityMatch: "Salmon",
        changes: [
          this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.swim"),
        ],
      },
    ];
  }

}