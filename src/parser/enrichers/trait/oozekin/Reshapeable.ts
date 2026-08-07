import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oozekin. A choice feature with Cube, Puddle and Humanoid options; the parsed
 * documents are renamed per option but keep "Reshapeable" as their original
 * name, so one enricher covers all three.
 */
export default class Reshapeable extends DDBEnricherData {

  static HOUR = 3600;

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Reshape",
      activationType: "action",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cube Form Engulf",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateEffects: true,
          saveOverride: {
            ability: ["dex"],
            dc: {
              calculation: "str",
              formula: "",
            },
          },
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
          targetCount: 1,
          data: {
            target: {
              affects: {
                special: "equal or smaller size",
              },
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cube Form",
        activityMatch: "Reshape",
        options: {
          durationSeconds: Reshapeable.HOUR,
        },
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange(".5", 10, "system.attributes.movement.walk"),
        ],
      },
      {
        name: "Puddle Form",
        activityMatch: "Reshape",
        options: {
          durationSeconds: Reshapeable.HOUR,
        },
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange(".5", 10, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.overrideChange("@attributes.movement.walk", 50, "system.attributes.movement.climb"),
        ],
      },
      {
        name: "Engulfed",
        activityMatch: "Cube Form Engulf",
        statuses: ["Grappled", "Restrained"],
      },
    ];
  }

}
