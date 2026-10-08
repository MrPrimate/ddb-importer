import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Taking the form is a self-enchantment whose riders are the form's effect and Elderwood Sap, so
 * the sap only appears while the form lasts. The DDB action copy keeps the plain activity.
 */
export default class WoodWose extends DDBEnricherData {

  static SAP_ID = "ddbWoodWoseElSap";

  static EFFECT_ID = "ddbWoodWoseEffct";

  override get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Wood Wose",
      useActivitySnippet: true,
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
    return [
      {
        init: {
          name: "Elderwood Sap",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "When you hit a creature with an attack roll",
          },
        },
        overrides: {
          id: WoodWose.SAP_ID,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Wood Wose",
        options: {
          transfer: true,
          durationSeconds: 600,
          description: "While you aren't wearing armor, your base Armor Class is 10 plus your Dexterity and Wisdom modifiers, and you have Advantage on Strength and Constitution saving throws.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.acFormulaAddChange("10 + @abilities.dex.mod + @abilities.wis.mod", 15),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("con"),
        ],
        data: {
          _id: WoodWose.EFFECT_ID,
        },
      },
      {
        name: "Wood Wose",
        type: "enchant",
        activityMatch: "Wood Wose",
        changes: toggleOffChanges("Leave Wood Wose Form"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [WoodWose.SAP_ID], effects: [WoodWose.EFFECT_ID] }),
          },
        },
      },
      {
        name: "Coated in Elderwood Sap",
        activityMatch: "Elderwood Sap",
        options: {
          expiry: "sourceStart",
          description: "While coated in Elderwood sap, the target has Disadvantage on attack rolls against targets other than the druid.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("!workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
      },
    ];
  }

}
