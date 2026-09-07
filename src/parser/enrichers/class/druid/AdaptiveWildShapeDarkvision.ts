import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShapeDarkvision extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  // DDB ships set-base and sense darkvision modifiers on this option, which generate
  // an always-on passive effect. This only applies while Wild Shaped, so drop them and
  // use the activity-linked effects below instead.
  override get clearAutoEffects(): boolean {
    return true;
  }

  // "you gain Darkvision (60 ft.) or increase your Darkvision by an additional 30 ft."
  // is an either/or: one activity for a form with no darkvision, one for a form that
  // already has some. The printed 60 ft is used over DDB's own modifier value of 30.
  override get activity(): IDDBActivityData {
    return {
      name: "Gain Darkvision",
      activationType: "special",
      targetType: "self",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Increase Darkvision",
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
        name: "Adaptive Wild Shape: Darkvision",
        activityMatch: "Gain Darkvision",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.senses.darkvision"),
        ],
      },
      {
        name: "Adaptive Wild Shape: Increased Darkvision",
        activityMatch: "Increase Darkvision",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("30", 20, "system.attributes.senses.darkvision"),
        ],
      },
    ];
  }

}
