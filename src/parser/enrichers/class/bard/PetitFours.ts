import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * College of Cuisine: eating a treat (an action or bonus action, or a reaction when it was
 * teleported to you) grants its flavour's benefit until the end of the eater's next turn. Sweet
 * gives temporary hit points and Sour adds acid damage, both rolling the Bardic Inspiration die.
 */
export default class PetitFours extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  static eatActivity(name: string, type: IDDBActivityType, extra: Partial<IDDBAdditionalActivity["build"]> = {}): IDDBAdditionalActivity {
    return {
      init: { name, type },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        activationOverride: { type: "bonus", value: 1, condition: "Eat a treat (an action, a bonus action, or a reaction when teleported to you)" },
        ...extra,
      },
      overrides: { targetSelf: true, noConsumeTargets: true },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      PetitFours.eatActivity("Eat Treat", DDBEnricherData.ACTIVITY_TYPES.UTILITY),
      PetitFours.eatActivity("Eat Treat: Sweet", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
        generateHealing: true,
        healingPart: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.bard.inspiration + max(1, @abilities.cha.mod)",
          types: ["temphp"],
        }),
      }),
      PetitFours.eatActivity("Eat Treat: Sour", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        generateDamage: true,
        generateTarget: true,
        damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.bard.inspiration", types: ["acid"] })],
        activationOverride: { type: "special", value: 1, condition: "A creature that ate a Sour treat hits with a weapon attack" },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    const treat = (name: string, description: string, changes: IActiveEffectChangeData[] = []): IDDBEffectHint => ({
      name: `Petit Four: ${name}`,
      activityMatch: "Eat Treat",
      options: { durationSeconds: 6, description },
      changes,
    });
    return [
      treat("Bitter", "Resistance to Poison damage and Advantage on saving throws against the Poisoned condition until the end of your next turn.", [
        DDBEnricherData.ChangeHelper.damageResistanceChange("poison"),
      ]),
      treat("Salty", "Advantage on Wisdom saving throws and immunity to the Charmed condition until the end of your next turn.", [
        DDBEnricherData.ChangeHelper.abilitySaveRollModeChange("wis", DDBEnricherData.ChangeHelper.ADVANTAGE),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
      ]),
      treat("Sour", "Your weapon attacks deal extra Acid damage equal to one roll of the bard's Bardic Inspiration die until the end of your next turn."),
      treat("Umami", "+2 bonus to AC until the end of your next turn.", [
        DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
      ]),
    ];
  }

}
