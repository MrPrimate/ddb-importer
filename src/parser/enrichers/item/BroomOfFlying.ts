import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Broom of Flying: a 50-foot fly speed while riding (30 feet above 200 pounds).
 */
export default class BroomOfFlying extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Send Alone or Recall",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "action", value: null, condition: "Command the broom to travel alone up to 1 mile" },
        },
        overrides: {
          rangeSelf: true,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Riding Broom",
        statuses: ["Flying"],
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("50", 20, "system.attributes.movement.fly"),
        ],
        options: {
          description: "Fly Speed 50 feet, or 30 feet while carrying more than 200 pounds.",
        },
      },
    ];
  }

}
