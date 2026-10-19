import DDBEnricherData from "../data/DDBEnricherData";

/** Dark Gift reaction: Proficiency Bonus to AC against the attack that hit, as 2014 Defensive Duelist. */
export default class GatheredWhispersUnearthlyScream extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetSelf: true,
      activationCondition: "When you are hit by an attack roll",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unearthly Scream",
        // the action lands on the feat beside the other benefits' actions; it is the feat's only utility
        activityTypesMatch: ["utility"],
        options: {
          expiry: "turnEnd",
          description: "Add your Proficiency Bonus to your AC against the triggering attack.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@prof", 20, "system.attributes.ac.bonus"),
        ],
        daeSpecialDurations: ["isAttacked"],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

}
