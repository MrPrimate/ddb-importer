import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Lantern Patron: a bonus action lights the lantern (20 ft bright, 20 ft dim) for a minute, once per
 * short or long rest. While lit, a reaction adds your Charisma modifier (minimum +1) to a save made
 * in the bright light, and enemies in the dim light that fail a save take radiant damage equal to
 * half your warlock level. Brilliant Illumination is its own feature. Lighting it is a
 * self-enchantment whose riders are the light and the two lantern activities, so they only appear
 * while it is lit.
 */
export default class IlluminatingAura extends DDBEnricherData {

  static HELPFUL_ID = "ddbIllumAuraHelp";

  static HARMFUL_ID = "ddbIllumAuraHarm";

  static EFFECT_ID = "ddbIllumAuraLght";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Lantern",
      targetType: "self",
      noTemplate: true,
      activationType: "bonus",
      addItemConsume: true,
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
      {
        init: { name: "Helpful Light", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateRoll: true,
          activationOverride: { type: "reaction", value: 1, condition: "A creature in the lantern's bright light makes a saving throw" },
          rollOverride: { prompt: false, visible: true, formula: "max(1, @abilities.cha.mod)", name: "Save Bonus" },
        },
        overrides: { id: IlluminatingAura.HELPFUL_ID, targetType: "creature", targetCount: 1, noConsumeTargets: true, noTemplate: true },
      },
      {
        init: { name: "Harmful Light", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          activationOverride: { type: "special", value: 1, condition: "An enemy in the lantern's dim light fails a saving throw" },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "ceil(@classes.warlock.levels / 2)", types: ["radiant"] })],
        },
        overrides: { id: IlluminatingAura.HARMFUL_ID, targetType: "creature", noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Illuminating Aura",
        options: {
          transfer: true,
          durationSeconds: 60,
          description: "The lantern sheds bright light in a 20-foot radius and dim light for another 20 feet. Ends early if you let go of the lantern.",
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(20, 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange(40, 20, "ATL.light.dim"),
        ],
        data: {
          _id: IlluminatingAura.EFFECT_ID,
        },
      },
      {
        name: "Illuminating Aura",
        type: "enchant",
        activityMatch: "Activate Lantern",
        changes: toggleOffChanges("Extinguish Lantern"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [IlluminatingAura.HELPFUL_ID, IlluminatingAura.HARMFUL_ID], effects: [IlluminatingAura.EFFECT_ID] }),
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Illuminating Aura",
        max: "1",
        period: "sr",
      }),
    };
  }

}
