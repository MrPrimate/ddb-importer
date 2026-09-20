import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * While raging the barbarian trails a 10-foot emanation of smoke. Nothing is rolled: any other
 * creature that starts its turn inside has Disadvantage on its next attack roll, which outlasts
 * leaving the smoke, so a free activity applies the effect by hand. DDB gives the feature no
 * action.
 */
export default class ShadowSmoke extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Emanate Smoke",
      targetType: "creature",
      activationType: "special",
      activationCondition: "While raging",
      noConsumeTargets: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "radius", size: "10" },
        },
        range: { override: true, value: null, units: "self", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Shadow Smoke: Obscured",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature other than you starts its turn in the smoke",
          },
          targetOverride: {
            override: true,
            affects: { count: "1", type: "creature" },
            template: {},
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shadow Smoke: Obscured",
        activityMatch: "Shadow Smoke: Obscured",
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
        daeSpecialDurations: ["1Attack"],
        options: {
          transfer: false,
          // the rules set no time limit; without DAE to end it on the attack, the turn edge does
          durationSeconds: 6,
          durationRounds: 1,
          expiry: "targetStart",
          description: "Disadvantage on its next attack roll. Needs midi-qol or automated-conditions-5e; without one of those this effect carries no mechanical change.",
        },
      },
    ];
  }

}
