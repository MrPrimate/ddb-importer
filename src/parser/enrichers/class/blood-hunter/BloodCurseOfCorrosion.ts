import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

/**
 * Order of the Mutant, 15th level. The base curse has no initial save - it
 * poisons, and the target saves at the end of each of its turns to end it.
 * Amplifying adds 4d6 necrotic on application and on each failed save.
 */
export default class BloodCurseOfCorrosion extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of Corrosion";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      activationType: "bonus",
      removeDamageParts: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: this.amplifiedName,
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
          generateEffects: true,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: _BloodCurse.AMPLIFY_CONDITION,
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 6,
              types: ["necrotic"],
            }),
          ],
          allowCritical: false,
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          rangeType: "ft",
          rangeValue: 30,
        },
      },
      this.amplifyCostActivity,
    ];
  }

  get effects(): IDDBEffectHint[] {
    const saveDC = this.hemocraftSaveDCFormula;

    return [
      {
        name: "Corroded",
        activityMatch: this.curseName,
        options: {
          durationSeconds: 60,
          description: "You can make a Constitution saving throw at the end of each of your turns, ending the curse on a success.",
        },
        statuses: ["Poisoned"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=Blood Curse of Corrosion (End of Turn Save),turn=end,saveDC=${saveDC},saveAbility=con,savingThrow=true,saveRemove=true,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Corroded (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 60,
          description: "You can make a Constitution saving throw at the end of each of your turns, ending the curse on a success. You take 4d6 necrotic damage each time you fail.",
        },
        statuses: ["Poisoned"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=Blood Curse of Corrosion (End of Turn Save),turn=end,damageRoll=4d6,damageType=necrotic,saveDC=${saveDC},saveAbility=con,savingThrow=true,saveRemove=true,saveDamage=nodamage,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
