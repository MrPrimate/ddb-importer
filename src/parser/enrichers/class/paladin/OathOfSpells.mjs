/* eslint-disable class-methods-use-this */
import SpellListExtractorMixin from "../../data/SpellListExtractorMixin.mjs";

export default class OathOfSpells extends SpellListExtractorMixin {

  async customFunction(_options) {
    if (this.is2014) return;
    this.SPELL_COLUMN_HEADER = "Spells";
    await this.generateSpellList("subclass");
  }

}


