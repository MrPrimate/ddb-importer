import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfBloatedAgony extends _BloodCurse {

  static DAMAGE_NAME = "Bloated Agony Damage";

  get curseName(): string {
    return "Blood Curse of Bloated Agony";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      removeDamageParts: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          removeDamageParts: true,
          activationCondition: _BloodCurse.AMPLIFY_CONDITION,
        },
      },
      {
        init: {
          name: BloodCurseOfBloatedAgony.DAMAGE_NAME,
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "The cursed creature makes more than one attack during its turn",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: ["necrotic"],
            }),
          ],
          allowCritical: false,
        },
      },
      this.amplifyCostActivity,
    ];
  }

  get ignoredConsumptionActivities(): string[] {
    return [_BloodCurse.AMPLIFY_NAME, BloodCurseOfBloatedAgony.DAMAGE_NAME];
  }

  get effects(): IDDBEffectHint[] {
    const swollen = [
      DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.abilities.str.check.roll.mode"),
      DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.abilities.dex.check.roll.mode"),
    ];
    const description = "Your body has swollen. You have disadvantage on Strength checks and Dexterity checks, and take 1d8 necrotic damage if you make more than one attack during your turn.";

    return [
      {
        // until the end of the caster's next turn
        name: "Bloated Agony",
        activityMatch: this.curseName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description,
        },
        daeSpecialDurations: ["turnEndSource"],
        changes: swollen,
      },
      {
        // amplified: lasts 1 minute, with a save at the end of each turn
        name: "Bloated Agony (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 60,
          description: `${description} You can make a Constitution saving throw at the end of each of your turns, ending the curse on a success.`,
        },
        changes: swollen,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=Blood Curse of Bloated Agony (End of Turn Save),turn=end,saveDC=${this.hemocraftSaveDCFormula},saveAbility=con,savingThrow=true,saveRemove=true,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
