import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dragonmark Spellcasting: one extra slot of half the character's level (rounded up, at most 5th),
 * regained on a Short or Long Rest, that only casts the Dragonmark feat's own spells or its
 * Spells of the Mark. The slot is the feat's single use, DDB's action spends it by hand, and
 * each eligible spell gets a cast activity at the slot's level.
 *
 * DDB only sends the Spells of the Mark as a spell list id, so the names are read from the table
 * in the Dragonmark feat's description. The slot level is fixed at import, so a level up needs a
 * re-import.
 */
export default class PotentDragonmark extends DDBEnricherData {

  static MARK_SPELL_ROW = /<tr>\s*<td>\s*(\d)\s*<\/td>\s*<td>([^<]+)<\/td>\s*<\/tr>/g;

  get dragonmarkFeat(): IDDBFeat | null {
    const feats = this.ddbParser.ddbData?.character?.feats ?? [];
    return feats.find((feat) => {
      const name = feat.definition?.name ?? "";
      return name.startsWith("Mark of ") || name === "Aberrant Dragonmark";
    }) ?? null;
  }

  get slotLevel(): number {
    const classes = this.ddbParser.ddbData?.character?.classes ?? [];
    const level = classes.reduce((total, klass) => total + (klass.level ?? 0), 0);
    return Math.min(5, Math.ceil(level / 2));
  }

  /** Spell names and levels from the Dragonmark feat's own grants and its Spells of the Mark table. */
  get markSpells(): { name: string; level: number }[] {
    const feat = this.dragonmarkFeat;
    if (!feat) return [];
    const spells = new Map<string, number>();
    const add = (name: string, level: number) => {
      const clean = name.replace(/[‘’]/g, "'").trim();
      if (clean !== "" && level > 0 && !spells.has(clean)) spells.set(clean, level);
    };

    for (const spell of this.ddbParser.ddbData?.character?.spells?.feat ?? []) {
      if (spell.componentId !== feat.definition.id) continue;
      add(spell.definition?.name ?? "", spell.definition?.level ?? 0);
    }

    const description = feat.definition?.description ?? "";
    const tableStart = description.indexOf("Spells of the Mark");
    if (tableStart !== -1) {
      const table = description.slice(tableStart, description.indexOf("</table>", tableStart));
      for (const match of table.matchAll(PotentDragonmark.MARK_SPELL_ROW)) {
        for (const name of match[2].split(",")) add(name, parseInt(match[1]));
      }
    }

    return Array.from(spells.entries())
      .map(([name, level]) => ({ name, level }))
      .filter((spell) => spell.level <= this.slotLevel)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }

  // DDB's "Dragonmark Spell Slot" action stays as a manual way to spend the slot
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.ddbParser.isMuncher) return [];
    const level = this.slotLevel;
    return this.markSpells.map((spell) => ({
      init: {
        name: `Dragonmark Slot: ${spell.name}`,
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
      },
      build: {
        generateConsumption: false,
        generateSpell: true,
      },
      overrides: {
        addItemConsume: true,
        addSpellUuid: spell.name,
        data: {
          spell: {
            level,
            // the spells are already in the spellbook as prepared, the copies would only repeat them
            spellbook: false,
          },
        },
      },
    }));
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll" }],
      },
    };
  }

}
