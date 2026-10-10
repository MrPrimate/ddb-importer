import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Entering the form is a self-enchantment whose rider is the aura's push damage, so it only
 * appears while the form lasts.
 */
export default class FormOfTheRiver extends DDBEnricherData {

  static PUSH_ID = "ddbFormOfRiverPD";

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Enter Form of the River",
      targetType: "self",
      noTemplate: true,
      activationType: "bonus",
      addItemConsume: true,
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
        name: "Form of the River",
        type: "enchant",
        activityMatch: "Enter Form of the River",
        changes: toggleOffChanges("Leave Form of the River"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [FormOfTheRiver.PUSH_ID] }),
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
          name: "Aura of the River: Push Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "When you successfully move a creature with your aura",
          },
          rangeOverride: {
            value: "5",
            units: "ft",
            special: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["bludgeoning"],
            }),
          ],
        },
        overrides: {
          id: FormOfTheRiver.PUSH_ID,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Form of the River",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
