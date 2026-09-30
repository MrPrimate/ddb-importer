import { CompendiumHelper, logger } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

interface ISpiritForm {
  /** Activity id, fixed so re-imports keep the same activities. */
  id: string;
  name: string;
  spell: string;
  /** DDB id of the 2024 spell, imported when the spell compendium lacks it. */
  spellId: number;
  /** The spell's own scaling, used when its summon activity cannot be read. */
  bonuses: Partial<I5eSummonsBonuses>;
  saves: boolean;
}

/**
 * The spell's level for the spirit: half the warlock level, rounded down, at most 9. Bracketed as
 * it replaces `@item.level` inside the spell's own formulas, so both sources read the same.
 */
const SPIRIT_LEVEL = "(min(floor(@classes.warlock.levels / 2), 9))";

/**
 * Vestige Patron (AU 2024) level 14. The vestige takes the stat block of the spirit from Summon
 * Celestial, Summon Fiend or Summon Undead, as if cast at half the warlock level (maximum 9), for
 * an hour, once per Long Rest. Like the official data, each form is a summon activity whose
 * profiles are the spell's spirit creatures, with the spell's level-scaled bonuses rewritten onto
 * that level: cleanup() reads the 2024 spells from the spell compendium, importing any that are
 * missing, and links their creatures.
 *
 * DDB's per-form options are not built (their actions, Temp HP, Radiant Mace..., are the
 * spirit's own) and their stat blocks stay out of the description, so the feature stays one
 * generic document; the description links the three spells instead of the sourcebook. The
 * vestige keeping its own HP and Divine Power is left to the table.
 */
export default class SemblanceOfLife extends DDBEnricherData {

  static FORMS: ISpiritForm[] = [
    {
      id: "semblanceCelest1",
      name: "Celestial Spirit",
      spell: "Summon Celestial",
      spellId: 2619108,
      bonuses: { ac: SPIRIT_LEVEL, hp: `10 * (${SPIRIT_LEVEL} - 5)`, attackDamage: SPIRIT_LEVEL },
      saves: false,
    },
    {
      id: "semblanceFiend01",
      name: "Fiendish Spirit",
      spell: "Summon Fiend",
      spellId: 2619117,
      bonuses: { ac: SPIRIT_LEVEL, hp: `15 * (${SPIRIT_LEVEL} - 6)`, attackDamage: SPIRIT_LEVEL, saveDamage: SPIRIT_LEVEL },
      saves: true,
    },
    {
      id: "semblanceUndead1",
      name: "Undead Spirit",
      spell: "Summon Undead",
      spellId: 2619119,
      bonuses: { ac: SPIRIT_LEVEL, hp: `10 * (${SPIRIT_LEVEL} - 3)`, attackDamage: SPIRIT_LEVEL },
      saves: true,
    },
  ];

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return SemblanceOfLife.FORMS.map((form): IDDBAdditionalActivity => ({
      id: form.id,
      init: {
        name: form.name,
        type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      },
      build: {
        generateSummon: true,
        generateActivation: true,
        generateConsumption: true,
        generateDuration: true,
        activationOverride: {
          type: "action",
          value: 1,
          condition: `Your ${form.spell.replace("Summon ", "")} vestige is within 90 feet`,
        },
        durationOverride: { value: "1", units: "hour", concentration: false },
      },
      overrides: {
        addItemConsume: true,
        noTemplate: true,
        data: {
          summon: { mode: "", prompt: false },
          match: {
            attacks: true,
            proficiency: true,
            saves: form.saves,
            disposition: true,
          },
          bonuses: form.bonuses,
          profiles: [],
        },
      },
    }));
  }

  /** The per-form options add nothing the three summons do not cover. */
  override get noChoiceBuild(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: { spent: null, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    };
  }

  /** The 2024 spirit spells in the spell compendium whose summons link creatures, keyed by name. */
  static async _findSpells(compendiumName: string, names: string[]): Promise<Map<string, { uuid: string; summon: I5eSummonActivity }>> {
    const found = new Map<string, { uuid: string; summon: I5eSummonActivity }>();
    const docs = await CompendiumHelper.retrieveMatchingCompendiumItems(names, compendiumName, {
      "system.source.rules": "2024",
    });
    for (const doc of docs) {
      const system = "system" in doc ? doc.system : null;
      const activities = (system && "activities" in system ? system.activities : {}) as Record<string, I5eActivity>;
      const summon = Object.values(activities ?? {}).find((a): a is I5eSummonActivity => a.type === "summon");
      // the lookup can hand back plain document data, which carries no uuid
      const uuid = doc.uuid ?? (doc._id ? `Compendium.${compendiumName}.Item.${doc._id}` : null);
      if (summon && doc.name && uuid && (summon.profiles ?? []).some((p) => p.uuid)) found.set(doc.name, { uuid, summon });
    }
    return found;
  }

  /** The spell's summon bonuses, with its `@item.level` read as the spirit level instead. */
  static _levelledBonuses(spellSummon: I5eSummonActivity, fallback: Partial<I5eSummonsBonuses>): Partial<I5eSummonsBonuses> {
    const bonuses: Record<string, string> = {};
    for (const [key, value] of Object.entries(spellSummon.bonuses ?? {})) {
      if (typeof value === "string" && value !== "") bonuses[key] = value.replaceAll("@item.level", SPIRIT_LEVEL);
    }
    return Object.keys(bonuses).length > 0 ? bonuses : fallback;
  }

  /**
   * DDB points each form at its spell "in the Player's Handbook" with a sourcebook link; the link
   * is dropped and the spell name becomes a link to the compendium spell when there is one.
   */
  static linkSpellNames(html: string, spellUuids: Map<string, string>): string {
    let result = html;
    for (const form of SemblanceOfLife.FORMS) {
      const uuid = spellUuids.get(form.spell);
      const name = uuid ? `@UUID[${uuid}]{${form.spell}}` : form.spell;
      result = result.replace(
        new RegExp(`${form.spell} spell in the (?:<a[^>]*>)?Player[’']s Handbook(?:</a>)?`, "g"),
        `${name} spell`,
      );
    }
    return result;
  }

  _linkDescription(spells: Map<string, { uuid: string }>): void {
    const description = this.data?.system?.description;
    if (!description) return;
    const uuids = new Map([...spells].map(([name, spell]) => [name, spell.uuid]));
    description.value = SemblanceOfLife.linkSpellNames(description.value ?? "", uuids);
    if (description.chat) description.chat = SemblanceOfLife.linkSpellNames(description.chat, uuids);
  }

  override async cleanup(): Promise<void> {
    const activities = this.data?.system?.activities as Record<string, I5eActivity> | undefined;
    if (!activities) return;

    // only the three forms remain; DDB's form actions and their effects belong to the spirit
    const formIds = new Set(SemblanceOfLife.FORMS.map((form) => form.id));
    for (const id of Object.keys(activities)) {
      if (!formIds.has(id)) delete activities[id];
    }
    this.data.effects = [];

    // no configured spell compendium (e.g. the audit harness): the forms cannot be linked
    const pack = CompendiumHelper.getCompendiumType("spell", false);
    if (!pack) {
      this._linkDescription(new Map());
      return;
    }

    const names = SemblanceOfLife.FORMS.map((form) => form.spell);
    let spells = await SemblanceOfLife._findSpells(pack.metadata.id, names);
    const missing = SemblanceOfLife.FORMS.filter((form) => !spells.has(form.spell));
    if (missing.length > 0 && game.user.isGM) {
      try {
        await DDBImporter.parse.spells({ ids: missing.map((form) => form.spellId), searchFilter: "Summon" });
        spells = await SemblanceOfLife._findSpells(pack.metadata.id, names);
      } catch (err) {
        logger.warn("Semblance of Life: unable to import the spirit summon spells", { err, missing });
      }
    }

    this._linkDescription(spells);

    for (const form of SemblanceOfLife.FORMS) {
      const summon = activities[form.id] as I5eSummonActivity | undefined;
      const spellSummon = spells.get(form.spell)?.summon;
      if (!summon) continue;
      if (!spellSummon) {
        logger.warn(`Semblance of Life: no ${form.spell} spell with linked spirits in the spell compendium; the ${form.name} form has no creatures`);
        continue;
      }
      summon.profiles = (spellSummon.profiles ?? [])
        .filter((p) => p.uuid)
        .map((p) => ({ ...foundry.utils.deepClone(p), _id: foundry.utils.randomID(), count: "" }));
      summon.bonuses = { ...summon.bonuses, ...SemblanceOfLife._levelledBonuses(spellSummon, form.bonuses) };
    }
  }

}
