/* eslint-disable class-methods-use-this */
import { logger, utils } from "../../../lib/_module.mjs";
import DDBEnricherData from "./DDBEnricherData.mjs";

export default class SpellListExtractorMixin extends DDBEnricherData {

  SPELL_COLUMN_HEADER = 'Prepared Spells';

  RENAME_REGEX = / Spells$/;

  extractSpells() {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.ddbParser.ddbDefinition.description;

    const table = tempDiv.querySelector('table');
    if (!table) {
      throw new Error('No table found in the HTML');
    }

    const headers = table.querySelectorAll('thead th');
    let spellColumnIndex = -1;

    headers.forEach((header, index) => {
      if (header.textContent.trim().includes(this.SPELL_COLUMN_HEADER)) {
        spellColumnIndex = index;
      }
    });

    if (spellColumnIndex === -1) {
      throw new Error(`Column "${this.SPELL_COLUMN_HEADER}" not found`);
    }

    const rows = table.querySelectorAll('tbody tr');
    const spells = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length > spellColumnIndex) {
        const spellsCell = cells[spellColumnIndex];
        const spellsText = spellsCell.textContent.trim();

        if (spellsText) {
          const spellsInCell = spellsText.split(',').map((spell) => utils.nameString(spell));
          spells.push(...spellsInCell);
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

    const source = spellListFactory.sources.find((s) => s.id === this.ddbParser.ddbDefinition.sourceId);

    logger.debug(`Generating Spell List for ${type} "${name}" from source "${source.label}" with spells:`, { spells, this: this });

    spellListFactory.generateSpellUuidsForSourceAndSpellList(source.acronym, name, spells, [this.is2014 ? 'is2014' : 'is2024']);

    await spellListFactory.buildSpellList(source, name);
    await spellListFactory.registerSpellLists();
  }

}
