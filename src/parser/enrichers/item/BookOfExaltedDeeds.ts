import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class BookOfExaltedDeeds extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spend Hours Reading",
      activationType: "hour",
      activationValue: 1,
      noConsumeTargets: true,
      noTemplate: true,
      targetType: "self",
      rangeSelf: true,
      activationCondition:
        "Track progress toward 80 hours; DDB’s attuned Wisdom bonus is already applied. Resolve other " +
        "permanent benefits after completion.",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Activate Halo", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        noeffect: false,
        activationCondition:
          "After completing the book; bright light 10 feet, dim light another 10 feet. Apply target-dependent benefits manually.",
      }),
      itemActivity("Dismiss Halo", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        activationCondition: "Remove the halo effect manually",
      }),
      itemActivity("Forbidden Reading Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        targetType: "creature",
        targetCount: "1",
        rangeType: "any",
        activationCondition: this.is2014
          ? "Only an evil creature attempting to read; ignore all damage reduction manually"
          : "Only a Fiend, Undead or servant of a Lower Planes god attempting to read; ignore all damage reduction manually",
        data: {
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 24, denomination: 6, type: "radiant" })],
          },
        },
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix:
        "<p>The Wisdom increase requires 80 hours of reading. The imported attunement effect already includes " +
        "DDB's +2 Wisdom; do not add it a second time after reading.</p>",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Exalted Halo",
        activityMatch: "Activate Halo",
        statuses: ["Marked"],
        options: { durationSeconds: null, transfer: false },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
        ],
        changes: this.is2014 ? [] : [DDBEnricherData.ChangeHelper.advantageSkillChange("per")],
      },
    ];
  }

}
