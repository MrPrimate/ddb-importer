import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024) level 6: Animate Dead is always prepared and can be cast once per Long
 * Rest without a spell slot. The free cast is this activity; DDB's slot-less copy of the spell is
 * dropped by FEATURE_SPELLS_IGNORE while the always-prepared copy stays in the spellbook.
 * Undead Fortitude and Withering Strike become an enchantment on a spell's summons (extra HP of
 * Intelligence modifier plus half the wizard level, and at least 1 necrotic damage on each
 * attack), applied to Animate Dead on import and by hand to other spells that raise Undead. It
 * replaces DDB's two reminder actions. The cast from the free use builds its own spell copy, so
 * it does not carry the enchantment, and the extra spell level is left to the caster.
 *
 * The 2014 School of Necromancy feature of the same name only adds the spell to the spellbook
 * and keeps its DDB defaults.
 */
export default class UndeadThralls extends DDBEnricherData {

  static ACTIVITY_ID = "ddbUndThrallEn01";

  static EFFECT_ID = "ddbUndThrallEf01";

  /** The 2014 feature is its DDB action activities; the AU cast sits alongside them. */
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return this.is2024;
  }

  /** The 2024 DDB actions are the two reminders the enchantment replaces. */
  override get builtFeaturesFromActionFilters(): string[] {
    return this.is2024 ? ["Undead Thralls"] : [];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014 || this.isAction) return [];
    return [
      {
        id: UndeadThralls.ACTIVITY_ID,
        init: {
          name: "Spell Improvements",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Applied to Animate Dead on import; apply to other spells that create or summon Undead by hand",
          },
        },
        overrides: {
          targetType: "self",
          noConsumeTargets: true,
          data: {
            restrictions: {
              type: "spell",
              allowMagical: true,
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014 || this.isAction) return [];
    return [
      {
        name: "Undead Thralls",
        type: "enchant",
        activityMatch: "Spell Improvements",
        changes: [
          DDBEnricherData.ChangeHelper.addChange(
            "@abilities.int.mod + floor(@classes.wizard.levels / 2)",
            20,
            "activities[summon].bonuses.hp",
          ),
          DDBEnricherData.ChangeHelper.addChange(
            "max(@abilities.int.mod, 1)[necrotic]",
            20,
            "activities[summon].bonuses.attackDamage",
          ),
        ],
        options: {
          description: "Undead Fortitude and Withering Strike: summoned Undead gain extra HP and deal extra Necrotic damage.",
        },
        data: {
          _id: UndeadThralls.EFFECT_ID,
        },
      },
    ];
  }

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.CAST : null;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      addSpellUuid: "Animate Dead",
      addItemConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    if (this.is2014) return {};
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Undead Thralls",
        max: "1",
        period: "lr",
      }),
      data: this.ddbParser.isMuncher
        ? {}
        : {
          flags: {
            ddbimporter: {
              transferEnchantment: {
                targetItemName: "Animate Dead",
                effectId: UndeadThralls.EFFECT_ID,
                activityId: UndeadThralls.ACTIVITY_ID,
              },
            },
          },
        },
    };
  }

}
