import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sorrow Knight: using Action Surge attunes the knight to the Shadowfell for a minute, granting
 * immunity to Charmed and Frightened and a Shade Form reaction that reduces a hit's damage to 0.
 */
export default class GrievingMantle extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Grieving Mantle",
      targetType: "self",
      activationType: "special",
      activationCondition: "You use Action Surge",
      data: {
        duration: {
          override: true,
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Shade Form",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "You are hit by an attack roll while Grieving Mantle is active",
          },
        },
        overrides: {
          targetType: "self",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grieving Mantle",
        activityMatch: "Grieving Mantle",
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
        ],
      },
    ];
  }

}
