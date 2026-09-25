import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Broom of Flying: the rider gets the broom's 50-foot fly speed only while astride it. DDB ships
 * the speed as an unconditional "set flying speed" modifier, which would leave whoever owns the
 * broom permanently able to fly, so that automatic effect is dropped and "Mount Broom" applies the
 * speed instead. The rider removes the effect on landing.
 */
export default class BroomOfFlying extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Mount Broom",
      targetType: "self",
      // 2014 needs only the command word spoken; 2024 makes it a Magic action
      activationType: this.is2014 ? "special" : "action",
      activationCondition: this.is2014 ? "Stand astride the broom and speak its command word" : "Stand astride the broom",
      data: {
        range: { override: true, units: "self" },
        // an applied effect with no expiry inherits the activity's duration, and the ride lasts
        // until the rider lands
        duration: { value: "", units: "spec", special: "Until you land or stop riding the broom" },
      },
    };
  }

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

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Riding Broom",
        activityMatch: "Mount Broom",
        statuses: ["Flying"],
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("50", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
        ],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "Fly Speed 50 feet while riding the broom, or 30 feet while it carries more than 200 pounds (it carries up to 400). Remove this effect when you land or stop riding.",
        },
      },
    ];
  }

}
