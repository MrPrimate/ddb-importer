/* eslint-disable class-methods-use-this */
import { logger, utils } from "../../../lib/_module.mjs";

export default class SpellListExtractor {

  USE_COLUMN_HEADER = false;

  USE_COLUMN_NUMBER = true;

  SPELL_COLUMN_NUMBER = 1;

  SPELL_COLUMN_HEADER = 'Prepared Spells';

  RENAME_REGEX = / Spells$/;

  name;

  description;

  constructor({
    name,
    description,
    is2014 = false,
    is2024 = true,
    sourceId = null,
  } = {}) {
    this.name = name;
    this.description = description;
    this.is2014 = is2014;
    this.is2024 = is2024;
    this.sourceId = sourceId;
  }

  extractSpells(withLevel = false) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.description;

    const table = tempDiv.querySelector('table');
    if (!table) {
      throw new Error('No table found in the HTML');
    }

    const headers = table.querySelectorAll('thead th');
    let spellColumnIndex = -1;

    headers.forEach((header, index) => {
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
    const spells = withLevel ? {} : [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length > spellColumnIndex) {
        const spellsCell = cells[spellColumnIndex];
        const spellsText = spellsCell.textContent.trim();

        if (spellsText) {
          const spellsInCell = spellsText.split(',').map((spell) => utils.nameString(spell));
          if (withLevel) {
            const level = `${cells[0].textContent.trim()}`;
            spells[level] = spells[level] ?? [];
            spells[level].push(...spellsInCell);
          } else {
            spells.push(...spellsInCell);
          }
        }
      }
    });

    return spells;
  }

  async generateSpellList(type = "class") {

    if (!game.user.isGM) return;

    const spellListFactory = new globalThis.DDBImporter.lib.SpellLists.SpellListFactory({ type });
    await spellListFactory.init();

    const spells = this.extractSpells();

    const name = this.name.replace(this.RENAME_REGEX, "");

    const source = spellListFactory.sources.find((s) => s.id === this.sourceId);

    logger.debug(`Generating Spell List for ${type} "${name}" from source "${source.label}" with spells:`, { spells, this: this });

    spellListFactory.generateSpellUuidsForSourceAndSpellList(source.acronym, name, spells, [this.is2014 ? 'is2014' : 'is2024']);

    await spellListFactory.buildSpellList(source, name);
    await spellListFactory.registerSpellLists();
  }

}
