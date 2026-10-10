import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Sorrow Knight: using Action Surge attunes the knight to the Shadowfell for a minute, granting
 * immunity to Charmed and Frightened and a Shade Form reaction that reduces a hit's damage to 0.
 * The mantle is a self-enchantment whose riders are the immunities and Shade Form, so the reaction
 * only appears while it lasts.
 */
export default class GrievingMantle extends DDBEnricherData {

  static SHADE_ID = "ddbGrievingMntSF";

  static EFFECT_ID = "ddbGrievingMntEf";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Grieving Mantle",
      targetType: "self",
      noTemplate: true,
      activationType: "special",
      activationCondition: "You use Action Surge",
      data: {
        duration: {
          override: true,
          value: "1",
          units: "minute",
        },
        enchant: {
          self: true,
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
          id: GrievingMantle.SHADE_ID,
          targetType: "self",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grieving Mantle",
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
        ],
        options: {
          transfer: true,
          durationSeconds: 60,
        },
        data: {
          _id: GrievingMantle.EFFECT_ID,
        },
      },
      {
        name: "Grieving Mantle",
        type: "enchant",
        activityMatch: "Grieving Mantle",
        changes: toggleOffChanges("End Grieving Mantle"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [GrievingMantle.SHADE_ID], effects: [GrievingMantle.EFFECT_ID] }),
          },
        },
      },
    ];
  }

}
