import DDBEnricherData from "../data/DDBEnricherData";

interface IFamiliarSummonOptions {
  /** 16 character activity id; several summons share a feature, so ids are explicit. */
  id: string;
  name: string;
  /** Spend the feature's own use (Familiar Friend's free cast). */
  itemConsume?: boolean;
  /** Spend a spell slot of level 1 or higher. */
  slotConsume?: boolean;
}

/**
 * Shared shape for the Arcana Unleashed familiar feats. Each builds its own Find Familiar summons
 * rather than altering the spell: a 2024 CR 0 Beast whose creature type is Celestial, Fey or Fiend,
 * cast over an hour. Every AU familiar feat needs Familiar Friend, so every summon carries
 * Fortified Familiar's twice-your-level HP bonus. Feat imbuements ride on the summon as effects,
 * which dnd5e applies to the summoned creature.
 */
export default class _FamiliarFeat extends DDBEnricherData {

  static FORTIFIED_HP = "2 * @details.level";

  static familiarSummon({ id, name, itemConsume = false, slotConsume = false }: IFamiliarSummonOptions): IDDBAdditionalActivity {
    const consumptionOverride = slotConsume
      ? {
        targets: [
          { type: "spellSlots", value: "1", target: "1", scaling: { mode: "", formula: "" } },
        ],
        scaling: { allowed: true, max: "9" },
      }
      : undefined;

    return {
      id,
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      },
      build: {
        generateSummon: true,
        generateActivation: true,
        generateConsumption: itemConsume || slotConsume,
        activationOverride: {
          type: "hour",
          value: 1,
          condition: "",
        },
        consumptionOverride,
      },
      overrides: {
        noTemplate: true,
        addItemConsume: itemConsume,
        data: _FamiliarFeat.familiarSummonData(),
      },
    };
  }

  static familiarSummonData(): Record<string, any> {
    return {
      summon: {
        mode: "cr",
        prompt: true,
      },
      match: {
        disposition: true,
      },
      bonuses: {
        hp: _FamiliarFeat.FORTIFIED_HP,
      },
      creatureTypes: ["celestial", "fey", "fiend"],
      profiles: [
        { name: "CR 0 Beast", count: "1", cr: "0", types: ["beast"] },
      ],
    };
  }

  /**
   * One imbued summon per damage type, each linked to an effect granting the familiar Resistance
   * to that type. `prefix` names both ("Otherworldly Necrotic Familiar").
   */
  static imbuedSummons(prefix: string, idPrefix: string, damageTypes: string[]): IDDBAdditionalActivity[] {
    return damageTypes.map((damageType) => _FamiliarFeat.familiarSummon({
      id: `${idPrefix}${damageType}`.padEnd(16, "0").slice(0, 16),
      name: `${prefix} ${utilsTitle(damageType)} Familiar`,
    }));
  }

  static imbuedEffects(prefix: string, damageTypes: string[], description: string): IDDBEffectHint[] {
    return damageTypes.map((damageType) => {
      const title = utilsTitle(damageType);
      return {
        name: `${prefix} Familiar: ${title} Resistance`,
        activityMatch: `${prefix} ${title} Familiar`,
        options: {
          durationSeconds: null,
          description: `${description} Resistance to ${title} damage.`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(damageType),
        ],
      };
    });
  }

}

function utilsTitle(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
