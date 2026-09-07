import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";

/**
 * Blood Hunter capstone. DDB ships no action for this feature, so all three
 * activities come from here:
 *
 * - a plain hemocraft die roll, for rerolling a non damage hemocraft die
 * - the same die as damage with a user chosen type, since a hemocraft die can
 *   be rolled for necrotic (Amplify Curse / Invoke Rite) or for any of the
 *   crimson rite types
 * - a refund of one Blood Maledict use on a crimson rite critical hit
 */
export default class SanguineMastery extends _BloodHunter {

  static REROLL_CONDITION = "Once per turn, when a blood hunter feature requires you to roll a hemocraft die (reroll and use either roll)";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reroll Hemocraft Die",
      targetType: "self",
      activationType: "special",
      activationCondition: SanguineMastery.REROLL_CONDITION,
      noConsumeTargets: true,
      data: {
        roll: {
          name: "Hemocraft Die",
          formula: _BloodHunter.DIE,
          prompt: false,
          visible: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Reroll Hemocraft Die (Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          noeffect: true,
          allowCritical: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: SanguineMastery.REROLL_CONDITION,
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: _BloodHunter.DIE,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
        overrides: {
          targetType: "creature",
          rangeType: "any",
          noConsumeTargets: true,
        },
      },
      {
        init: {
          name: "Regain Blood Maledict Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you score a critical hit with a weapon for which you have an active crimson rite",
          },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
          itemConsumeTargetName: "Blood Maledict",
          itemConsumeValue: "-1",
        },
      },
    ];
  }

}
