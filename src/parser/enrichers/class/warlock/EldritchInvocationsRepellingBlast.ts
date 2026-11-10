import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Repelling Blast: an enchant rider that marks a cantrip as repelling (a hit can push the target
 * 10 feet; Large or smaller in 2024). There is no automation channel for the push, so the rider
 * renames the cantrip and appends the rule to its description.
 * The character importer's enchantment step applies it to Eldritch Blast.
 */
export default class EldritchInvocationsRepellingBlast extends DDBEnricherData {

  static ACTIVITY_ID = "ddbRepelBlastEn1";

  static EFFECT_ID = "ddbRepelBlastEf1";

  static ADVANCEMENT_ID = "ddbRepelBlastAd1";

  /** The 2014 enchantment the Modify Item advancement applies, a copy no activity links. */
  static ADVANCEMENT_EFFECT_ID = "ddbRepelBlastAe1";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Make Repelling",
      id: EldritchInvocationsRepellingBlast.ACTIVITY_ID,
      activationType: "special",
      activationCondition: "Applied to Eldritch Blast on import; apply to other warlock attack cantrips by hand",
      data: {
        restrictions: {
          type: "spell",
          allowMagical: true,
        },
      },
    };
  }

  get pushText(): string {
    return this.is2014
      ? "When you hit a creature with this cantrip, you can push the creature up to 10 feet away from you in a straight line."
      : "When you hit a Large or smaller creature with this cantrip, you can push the creature up to 10 feet straight away from you.";
  }

  override get effects(): IDDBEffectHint[] {
    const [effect] = this.enchantEffects;
    if (!this.is2014) return [effect];
    const advancementEffect = DDBEnricherData.modifyItemEffectCopy(effect, EldritchInvocationsRepellingBlast.ADVANCEMENT_EFFECT_ID);
    return [effect, advancementEffect];
  }

  /** The enchantment the enchant activity applies. */
  get enchantEffects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Repelling Blast",
        activityMatch: "Make Repelling",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} [Repelling]", 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange(`{}<p><strong>Repelling Blast.</strong> ${this.pushText}</p>`, 20, "system.description.value"),
        ],
        options: {
          description: `Repelling Blast: ${this.pushText}`,
        },
        data: {
          _id: EldritchInvocationsRepellingBlast.EFFECT_ID,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const flags: IDDBImporterFlags = this.ddbParser.isMuncher
      ? {}
      : {
        transferEnchantment: {
          targetItemName: "Eldritch Blast",
          effectId: EldritchInvocationsRepellingBlast.EFFECT_ID,
          activityId: EldritchInvocationsRepellingBlast.ACTIVITY_ID,
        },
      };

    return {
      data: {
        flags: {
          ddbimporter: flags,
        },
      },
    };
  }

  /**
   * The 2014 invocation always changes Eldritch Blast, so a compendium copy applies it there through
   * a Modify Item advancement. The 2024 one is applied to a cantrip the player picks.
   */
  override get additionalAdvancements(): I5eAdvancement[] {
    if (!this.is2014) return [];
    return [
      this.modifyItemAdvancement({
        id: EldritchInvocationsRepellingBlast.ADVANCEMENT_ID,
        name: "Repelling Eldritch Blast",
        level: 1,
        effectId: EldritchInvocationsRepellingBlast.ADVANCEMENT_EFFECT_ID,
        identifiers: ["spell:eldritch-blast"],
      }),
    ];
  }

}
