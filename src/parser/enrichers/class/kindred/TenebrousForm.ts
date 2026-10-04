import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Kindred (Tenebrous Form): a Magic action and 5 Blood Points armour you in darkness for a minute:
 * +4 AC, 4d10 temporary hit points, Advantage on Strength and Constitution checks and saves, and
 * Unarmed Strikes with 5 more feet of reach and an extra 2d10 cold. 1 Blood Point extends it a minute.
 */
export default class TenebrousForm extends DDBEnricherData {

  static extra(name: string, type: IDDBActivityType, condition: string, build: Partial<IDDBAdditionalActivity["build"]>, overrides: IDDBActivityData): IDDBAdditionalActivity {
    return {
      init: { name, type },
      build: { generateConsumption: false, generateTarget: true, generateActivation: true, activationOverride: { type: "special", value: 1, condition }, ...build },
      overrides,
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Assume Tenebrous Form",
      targetType: "self",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: "5",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      TenebrousForm.extra("Dark Vigor", DDBEnricherData.ACTIVITY_TYPES.HEAL, "You assume the Tenebrous Form", {
        generateHealing: true,
        healingPart: DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, types: ["temphp"] }),
      }, { targetSelf: true, noConsumeTargets: true }),
      TenebrousForm.extra("Umbral Limbs", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, "You hit with an Unarmed Strike while in the Tenebrous Form", {
        generateDamage: true,
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, types: ["cold"] })],
      }, { targetType: "creature", noConsumeTargets: true, noTemplate: true }),
      TenebrousForm.extra("Extend Shadows", DDBEnricherData.ACTIVITY_TYPES.UTILITY, "Extend the Tenebrous Form by 1 minute", {
        generateConsumption: true,
      }, { targetSelf: true, addItemConsume: true, itemConsumeTargetName: "feat:blood-potency", itemConsumeValue: "1" }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Tenebrous Form",
        activityMatch: "Assume Tenebrous Form",
        options: {
          durationSeconds: 60,
          description: "+4 AC; Advantage on Strength and Constitution checks and saves; Unarmed Strikes reach 5 feet further, deal an extra 2d10 Cold and can grapple Huge or smaller. 1 Blood Point casts Misty Step to dim light or darkness.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("4", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.abilityCheckRollModeChange("str", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.abilityCheckRollModeChange("con", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.abilitySaveRollModeChange("str", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.abilitySaveRollModeChange("con", DDBEnricherData.ChangeHelper.ADVANTAGE),
        ],
      },
    ];
  }

}
