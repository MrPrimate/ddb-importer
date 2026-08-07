import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The transformation toggle itself. DDB's matching action ships no limitedUse, so the once per
 * short rest limit is added here; the Hybrid Transformation Features enchantment consumes it via
 * CONSUMPTION_LINKS.
 *
 * Hybrid Transformation Mastery (18th level) removes the limit; that is not modelled here because
 * clearing max would break the consumption target on the child feature.
 */
export default class HybridTransformation extends DDBEnricherData {


  static STRIKE_IDS = {
    small: { action: "ddbLycanStrike01", bonus: "ddbLycanStrike02" },
    large: { action: "ddbLycanStrike11", bonus: "ddbLycanStrike12" },
  };

  static BLOODLUST_ID = "ddbLycanBloodlst";

  // Predatory Strikes lets you use either Strength or Dexterity, so the ability mod is suppressed
  // and both the mod and proficiency are rolled into the attack bonus instead.
  static ATTACK_BONUS = "max(@abilities.str.mod, @abilities.dex.mod) + @prof";

  static DAMAGE_BONUS = "max(@abilities.str.mod, @abilities.dex.mod)";

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Hybrid Transformation",
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      noTemplate: true,
      data: {
        enchant: {
          self: true,
        },
        visibility: {
          identifier: "blood-hunter",
        },
        duration: {
          value: "1",
          units: "hour",
        },
      },
    };
  }

  _strikeActivities(denomination: number, ids: { action: string; bonus: string }): IDDBAdditionalActivity[] {
    const damageParts = [
      DDBEnricherData.basicDamagePart({
        customFormula: `1d${denomination} + ${HybridTransformation.DAMAGE_BONUS}`,
        types: ["bludgeoning", "slashing"],
      }),
    ];

    const attack = {
      ability: "none" as T5eActivityAttackAbility,
      bonus: HybridTransformation.ATTACK_BONUS,
      type: {
        value: "melee",
        classification: "unarmed",
      },
    };

    const target: I5eActivityTarget = {
      affects: {
        count: "1",
        type: "creature",
      },
    };

    return [
      {
        init: {
          name: "Predatory Strike",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateRange: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          damageParts,
          activationOverride: {
            type: "action",
          },
        },
        overrides: {
          id: ids.action,
          data: {
            attack,
            target,
            range: { value: 5, units: "ft" },
            duration: { units: "inst" },
          },
        },
      },
      {
        init: {
          name: "Predatory Strike (Bonus Action)",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateRange: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          damageParts,
          activationOverride: {
            type: "bonus",
            condition: "After you take the Attack action to make an unarmed strike",
          },
        },
        overrides: {
          id: ids.bonus,
          data: {
            attack,
            target,
            range: { value: 5, units: "ft" },
            duration: { units: "inst" },
          },
        },
      },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ...this._strikeActivities(6, HybridTransformation.STRIKE_IDS.small),
      ...this._strikeActivities(8, HybridTransformation.STRIKE_IDS.large),
      {
        init: {
          name: "Bloodlust",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateRange: false,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          saveOverride: {
            ability: ["wis"],
            dc: { calculation: "", formula: "8" },
          },
          activationOverride: {
            type: "turnStart",
            condition: "You start your turn with fewer hit points than half your hit point maximum",
          },
        },
        overrides: {
          id: HybridTransformation.BLOODLUST_ID,
          targetType: "self",
          data: {
            range: { units: "self" },
            duration: { units: "inst" },
          },
        },
      },
    ];
  }

  _hybridFormEffect(damageBonus: number, id: string): IDDBEffectHint {
    return {
      name: `Hybrid Form (+${damageBonus})`,
      // rider effects are pulled in by the enchantment, they must never attach to an activity
      activitiesMatch: ["Not real"],
      options: {
        transfer: true,
        durationSeconds: 3600,
        description: "Resilient Hide's AC bonus only applies while you are not wearing heavy armor.",
      },
      changes: [
        // Feral Might
        DDBEnricherData.ChangeHelper.unsignedAddChange(`+${damageBonus}`, 20, "system.bonuses.mwak.damage"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.check.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
        // Resilient Hide
        DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
        DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
        DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.traits.dr.bypasses"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("sil", 20, "system.traits.dr.bypasses"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.ac.bonus"),
      ],
      midiChanges: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.check.str"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.save.str"),
      ],
      ac5eChanges: [
        DDBEnricherData.ChangeHelper.customChange("ability.str", 20, "flags.automated-conditions-5e.check.advantage"),
        DDBEnricherData.ChangeHelper.customChange("ability.str", 20, "flags.automated-conditions-5e.save.advantage"),
      ],
      data: {
        _id: id,
      },
    };
  }

  _enchantProfile({ effectId, strikeIds, level }: {
    effectId: string;
    strikeIds: { action: string; bonus: string };
    level: { min: number | null; max: number | null };
  }): IDDBEffectHint {
    return {
      name: "Hybrid Form",
      type: "enchant",
      activityMatch: "Hybrid Transformation",
      options: {
        durationSeconds: 3600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("{} (Hybrid Form)", 10, "name"),
      ],
      data: {
        flags: {
          ddbimporter: {
            effectIdLevel: level,
            activityRiders: [strikeIds.action, strikeIds.bonus, HybridTransformation.BLOODLUST_ID],
            effectRiders: [effectId],
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    const bands = [
      { damageBonus: 1, effectId: "ddbLycanForm0001", strikeIds: HybridTransformation.STRIKE_IDS.small, level: { min: null, max: 10 } },
      { damageBonus: 2, effectId: "ddbLycanForm0002", strikeIds: HybridTransformation.STRIKE_IDS.large, level: { min: 11, max: 17 } },
      { damageBonus: 3, effectId: "ddbLycanForm0003", strikeIds: HybridTransformation.STRIKE_IDS.large, level: { min: 18, max: null } },
    ];

    return [
      ...bands.map((band) => this._hybridFormEffect(band.damageBonus, band.effectId)),
      ...bands.map((band) => this._enchantProfile(band)),
    ];
  }

  /**
   * "Hybrid Transformation Features" is skipped as its own document, so its text (Feral Might,
   * Resilient Hide, Predatory Strikes, Bloodlust) is folded in here alongside the automation.
   */
  get _featuresDescription(): string {
    const description = this.getClassFeatureDescription({
      featureName: "Hybrid Transformation Features",
      subClassName: "Order of the Lycan",
    });

    return description ? `<h3>Hybrid Transformation Features</h3>${description}` : "";
  }

  // matches a single non-nested blockquote; a DOM round trip is not used here because
  // re-serialising would escape the & in Foundry's &Reference[...] enrichers
  static BLOCKQUOTE_REGEX = /<blockquote\b[^>]*>(?:(?!<\/blockquote>)[\s\S])*<\/blockquote>\s*/gi;

  _stripBuilderNote(html: string): string {
    return DDBEnricherData.stripBuilderNote(html, "Character Builder");
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        name: "Hybrid Transformation",
      },
      uses: this._getUsesWithSpent({
        type: "class",
        // DDB names the action with a trailing space
        name: "Hybrid Transformation",
        includesName: true,
        max: "1",
        period: "sr",
      }),
      // only the transformation toggle spends a Hybrid Transformation use
      ignoredConsumptionActivities: ["Predatory Strike", "Predatory Strike (Bonus Action)", "Bloodlust"],
      descriptionSuffix: `${this._featuresDescription}<p><em>Crimson Rite is not applied to the Predatory Strike activities automatically; add the rite die to the damage roll manually or apply the enchantment to this item.</em></p>`,
      // runs after descriptionSuffix has been appended
      func: ({ enricher }) => {
        const description = enricher.data.system.description;
        if (!description) return;
        description.value = this._stripBuilderNote(description.value);
        if (description.chat) description.chat = this._stripBuilderNote(description.chat);
      },
    };
  }

}
