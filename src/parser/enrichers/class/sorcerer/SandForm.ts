import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Entering the form is a self-enchantment whose rider is the damage resistance reaction, so it
 * only appears while the form lasts.
 */
export default class SandForm extends DDBEnricherData {

  static RESISTANCE_ID = "ddbSandFormResis";

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Sand Form (Enter)",
      targetType: "self",
      noTemplate: true,
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: 5,
      data: {
        duration: { value: "1", units: "minute", special: "" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Sand Form",
        type: "enchant",
        activityMatch: "Sand Form (Enter)",
        changes: toggleOffChanges("Sand Form (Leave)"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [SandForm.RESISTANCE_ID] }),
          },
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Sand Form (Damage Resistance)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          chatFlavor: "Until the end of that turn you have resistance to all damage, including against the triggering attack.",
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "When an attacker you can see hits you with an attack",
          },
        },
        overrides: {
          id: SandForm.RESISTANCE_ID,
          useActivitySnippet: true,
        },
      },
    ];
  }

}
