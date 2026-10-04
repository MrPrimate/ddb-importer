import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Lantern Patron: a bonus action lights the lantern (20 ft bright, 20 ft dim) for a minute, once per
 * short or long rest. While lit, a reaction adds your Charisma modifier (minimum +1) to a save made
 * in the bright light, and enemies in the dim light that fail a save take radiant damage equal to
 * half your warlock level. Brilliant Illumination is its own feature.
 */
export default class IlluminatingAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Lantern",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
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
        overrides: { targetType: "creature", targetCount: 1, noConsumeTargets: true, noTemplate: true },
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
        overrides: { targetType: "creature", noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Illuminating Aura",
        activityMatch: "Activate Lantern",
        options: {
          durationSeconds: 60,
          description: "The lantern sheds bright light in a 20-foot radius and dim light for another 20 feet. Ends early if you let go of the lantern.",
        },
        tokenChanges: [
          DDBEnricherData.ChangeHelper.tokenChange("token.light.bright", "upgrade", 20, 20),
          DDBEnricherData.ChangeHelper.tokenChange("token.light.dim", "upgrade", 40, 20),
        ],
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
