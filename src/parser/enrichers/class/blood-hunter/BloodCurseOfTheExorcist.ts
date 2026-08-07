import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

/**
 * Order of the Ghostslayer, 15th level. The base curse frees the target;
 * amplifying punishes whatever charmed, frightened or possessed them.
 */
export default class BloodCurseOfTheExorcist extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of the Exorcist";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get clearAutoEffects(): boolean {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      activationType: "bonus",
      activationCondition: "The creature is charmed or frightened, or is under a possession effect",
      removeDamageParts: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: this.amplifiedName,
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateSave: true,
          generateDamage: true,
          generateEffects: true,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: `${_BloodCurse.AMPLIFY_CONDITION}. Targets the creature that charmed, frightened or possessed the target of your curse.`,
          },
          saveOverride: {
            ability: ["wis"],
            dc: this.hemocraftSaveDC,
          },
          onSave: "none",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 6,
              types: ["psychic"],
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
    return [
      {
        name: "Stunned by Exorcism",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnEndSource"],
        statuses: ["Stunned"],
      },
    ];
  }

}
