import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Activating is a self-enchantment whose riders are the light and speed effect and Vengeful
 * Flame, so the flame only appears while Burning Spirit lasts.
 */
export default class BurningSpirit extends DDBEnricherData {

  static FLAME_ID = "ddbBurningSpirVF";

  static EFFECT_ID = "ddbBurningSpirEf";

  override get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Burning Spirit",
      useActivitySnippet: true,
      targetType: "self",
      noTemplate: true,
      activationType: "bonus",
      addItemConsume: true,
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
          name: "Vengeful Flame",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "At the end of each of your turns",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "max(2, 2 * @abilities.cha.mod)",
              types: ["fire"],
            }),
          ],
        },
        overrides: {
          id: BurningSpirit.FLAME_ID,
          useActivitySnippet: true,
        },
      },
      {
        init: {
          name: "Restore Burning Spirit",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
        overrides: {
          useActivitySnippet: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Burning Spirit",
        options: {
          transfer: true,
          durationSeconds: 600,
          description: "You shed Bright Light in your Aura of Protection and Dim Light for an additional 30 feet, your Speed increases by 10 feet, and you can move through other creatures' spaces.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10", 20),
        ],
        tokenChanges: [
          DDBEnricherData.ChangeHelper.tokenChange("token.light.bright", "upgrade", "@scale.paladin.aura-of-protection", 20),
          DDBEnricherData.ChangeHelper.tokenChange("token.light.dim", "upgrade", "@scale.paladin.aura-of-protection + 30", 20),
        ],
        data: {
          _id: BurningSpirit.EFFECT_ID,
        },
      },
      {
        name: "Burning Spirit",
        type: "enchant",
        activityMatch: "Activate Burning Spirit",
        changes: toggleOffChanges("End Burning Spirit"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [BurningSpirit.FLAME_ID], effects: [BurningSpirit.EFFECT_ID] }),
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "class", name: "Burning Spirit", max: "1", period: "lr" }),
    };
  }

}
