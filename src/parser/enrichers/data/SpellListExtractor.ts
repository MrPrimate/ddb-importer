import { logger, utils } from "../../../lib/_module";

export default class SpellListExtractor {

  USE_COLUMN_HEADER = false;

  USE_COLUMN_NUMBER = true;

  SPELL_COLUMN_NUMBER = 1;

  SPELL_COLUMN_HEADER = 'Prepared Spells';

  RENAME_REGEX = / Spells$/;

  name: string;

  description: string;

  is2014: boolean;

  is2024: boolean;

  sourceId: any;

  constructor({
    name,
    description,
    is2014 = false,
    is2024 = true,
    sourceId = null,
  }: {
    name: string;
    description: string;
    is2014?: boolean;
    is2024?: boolean;
    sourceId?: any;
  } = { name: "", description: "" }) {
    this.name = name;
    this.description = description;
    this.is2014 = is2014;
    this.is2024 = is2024;
    this.sourceId = sourceId;
  }

  extractSpells(withLevel?: false): string[];
  extractSpells(withLevel: true): Record<string, string[]>;
  extractSpells(withLevel: boolean = false): string[] | Record<string, string[]> {
    const levelRegex = /(\d+)/;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.description;

    const table = tempDiv.querySelector('table');
    if (!table) {
      logger.error('No table found in the HTML', { this: this, description: this.description });
      return withLevel ? {} : [];
    }

    const headers = table.querySelectorAll('thead th');
    let spellColumnIndex = -1;

    headers.forEach((header: any, index: number) => {
      if (this.USE_COLUMN_NUMBER && index === this.SPELL_COLUMN_NUMBER) {
        spellColumnIndex = index;
      } else if (this.USE_COLUMN_HEADER && header.textContent.trim().includes(this.SPELL_COLUMN_HEADER)) {
        spellColumnIndex = index;
      }
    });

    if (headers.length === 0) {
      spellColumnIndex = 1;
    }

    if (spellColumnIndex === -1) {
      logger.error(`Unable to find spell column in table headers`, { this: this, headers });
      throw new Error(`Unable to parse spell column header`);
    }

    const rows = table.querySelectorAll('tbody tr');
    const spells: any = withLevel ? {} : [];

    rows.forEach((row: any) => {
      const cells = row.querySelectorAll('td');
      if (cells.length > spellColumnIndex) {
        const spellsCell = cells[spellColumnIndex];
        const spellsText = spellsCell.textContent.trim();

        if (spellsText) {
          const spellsInCell = spellsText.split(',').map((spell: string) => utils.nameString(spell));
          const level = `${cells[0].textContent.trim()}`.match(levelRegex);
          if (withLevel && level) {
            spells[level[0]] = spells[level[0]] ?? [];
            spells[level[0]].push(...spellsInCell);
          } else if (!withLevel) {
            spells.push(...spellsInCell);
          }
        }
      }
    });

    return spells;
  }

  async generateSpellList(type: string = "class"): Promise<void> {

    if (!game.user.isGM) return;

    const spellListFactory = new (globalThis as any).DDBImporter.lib.SpellLists.SpellListFactory({ type });
    await spellListFactory.init();

    const spells = this.extractSpells();

    if (spells.length === 0) {
      logger.warn(`No spells found for ${type} "${this.name}"`, { this: this });
      return;
    }

    const name = this.name.replace(this.RENAME_REGEX, "");

    const source = spellListFactory.sources.find((s: any) => s.id === this.sourceId) ?? spellListFactory.sources.find((s: any) => s.id === 9999999);

    logger.debug(`Generating Spell List for ${type} "${name}" from source "${source.acronym}" with spells:`, { spells, this: this });

    spellListFactory.generateSpellUuidsForSourceAndSpellList(source.acronym, name, spells, [this.is2014 ? 'is2014' : 'is2024']);

    await spellListFactory.buildSpellList(source, name);
    await spellListFactory.registerSpellLists();
  }

}
