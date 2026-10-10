import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Kindred (Tenebrous Form): a Magic action and 5 Blood Points armour you in darkness for a minute:
 * +4 AC, 4d10 temporary hit points, Advantage on Strength and Constitution checks and saves, and
 * Unarmed Strikes with 5 more feet of reach and an extra 2d10 cold. 1 Blood Point extends it a minute.
 * Assuming the form is a self-enchantment whose riders are the form's effect and its three
 * activities, so they only appear while it lasts (Dark Vigor is used straight after assuming it).
 */
export default class TenebrousForm extends DDBEnricherData {

  static VIGOR_ID = "ddbTenebrousFmDV";

  static LIMBS_ID = "ddbTenebrousFmUL";

  static EXTEND_ID = "ddbTenebrousFmES";

  static EFFECT_ID = "ddbTenebrousFmEf";

  static extra(name: string, type: IDDBActivityType, condition: string, build: Partial<IDDBAdditionalActivity["build"]>, overrides: IDDBActivityData): IDDBAdditionalActivity {
    return {
      init: { name, type },
      build: { generateConsumption: false, generateTarget: true, generateActivation: true, activationOverride: { type: "special", value: 1, condition }, ...build },
      overrides,
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Assume Tenebrous Form",
      targetType: "self",
      noTemplate: true,
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: "5",
      data: {
        duration: { value: "1", units: "minute" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      TenebrousForm.extra("Dark Vigor", DDBEnricherData.ACTIVITY_TYPES.HEAL, "You assume the Tenebrous Form", {
        generateHealing: true,
        healingPart: DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, types: ["temphp"] }),
      }, { id: TenebrousForm.VIGOR_ID, targetSelf: true, noConsumeTargets: true }),
      TenebrousForm.extra("Umbral Limbs", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, "You hit with an Unarmed Strike while in the Tenebrous Form", {
        generateDamage: true,
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, types: ["cold"] })],
      }, { id: TenebrousForm.LIMBS_ID, targetType: "creature", noConsumeTargets: true, noTemplate: true }),
      TenebrousForm.extra("Extend Shadows", DDBEnricherData.ACTIVITY_TYPES.UTILITY, "Extend the Tenebrous Form by 1 minute", {
        generateConsumption: true,
      }, { id: TenebrousForm.EXTEND_ID, targetSelf: true, addItemConsume: true, itemConsumeTargetName: "feat:blood-potency", itemConsumeValue: "1" }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Tenebrous Form",
        options: {
          transfer: true,
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
        data: {
          _id: TenebrousForm.EFFECT_ID,
        },
      },
      {
        name: "Tenebrous Form",
        type: "enchant",
        activityMatch: "Assume Tenebrous Form",
        changes: toggleOffChanges("Leave Tenebrous Form"),
        data: {
          flags: {
            ddbimporter: riders({
              activities: [TenebrousForm.VIGOR_ID, TenebrousForm.LIMBS_ID, TenebrousForm.EXTEND_ID],
              effects: [TenebrousForm.EFFECT_ID],
            }),
          },
        },
      },
    ];
  }

}
