/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

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

  get effect() {

    return {
      multiple: [
        {
          name: "Owl",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Owl",
          },
          changes: [
            {
              key: "system.attributes.senses.darkvision",
              value: "60",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
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
          data: {
            "flags.ddbimporter.activityMatch": "Panther",
          },
          changes: [
            this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
          ],
        },
        {
          name: "Salmon",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Salmon",
          },
          changes: [
            this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.swim"),
          ],
        },
      ],
    };
  }

}
