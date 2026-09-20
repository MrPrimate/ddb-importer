import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../../data/RegionBuilders";

/**
 * While raging the barbarian trails a 10-foot emanation of smoke. Nothing is rolled: any other
 * creature that starts its turn inside has Disadvantage on its next attack roll, which outlasts
 * leaving the smoke, so the region fires a free activity that applies the effect where one held
 * only while inside would drop it early. DDB gives the feature no action.
 */
export default class ShadowSmoke extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Emanate Smoke", {
      template: { type: "radius", size: "10" },
      activationType: "special",
      activationCondition: "While raging",
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenTurnStart"],
          activityName: "Shadow Smoke: Obscured",
          excludeSelf: true,
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Shadow Smoke: Obscured", {
        condition: "A creature other than you starts its turn in the smoke",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shadow Smoke: Obscured",
        activityMatch: "Shadow Smoke: Obscured",
        changes: [DDBEnricherData.ChangeHelper.disadvantageAttackChange()],
        daeSpecialDurations: ["1Attack"],
        options: {
          transfer: false,
          // the rules set no time limit; without DAE to end it on the attack, the turn edge does
          expiry: "targetStart",
          description: "Disadvantage on its next attack roll.",
        },
      },
    ];
  }

}
