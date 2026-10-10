import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Taking the form is a self-enchantment whose riders are the form's effect and Umbral Retaliation,
 * so the reaction only appears while the form lasts. The DDB action copy keeps the plain activity.
 */
export default class UmbralForm extends DDBEnricherData {

  static RETALIATION_ID = "ddbUmbralFormRet";

  static EFFECT_ID = "ddbUmbralFormEff";

  override get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      noTemplate: true,
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        range: {
          units: "self",
        },
        duration: {
          value: "10",
          units: "minute",
        },
        ...(this.isAction ? {} : { enchant: { self: true } }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Umbral Retaliation",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "A creature you can see hits you with a melee attack",
          },
        },
        overrides: {
          id: UmbralForm.RETALIATION_ID,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@prof",
                  types: ["cold"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Umbral Form",
        options: {
          transfer: true,
          durationSeconds: 600,
          description: "While in dim light or darkness you can take the Hide action as a Bonus Action, and you can move through a space as narrow as 1 inch wide without squeezing.",
        },
        data: {
          _id: UmbralForm.EFFECT_ID,
        },
      },
      {
        // the form activity keeps DDB's name, so the profile matches it by type
        name: "Umbral Form",
        type: "enchant",
        changes: toggleOffChanges("Leave Umbral Form"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [UmbralForm.RETALIATION_ID], effects: [UmbralForm.EFFECT_ID] }),
          },
        },
      },
    ];
  }

}
