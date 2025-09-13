/* eslint-disable class-methods-use-this */
import SpellListExtractorMixin from "../../data/SpellListExtractorMixin.mjs";

export default class ExtraSpells extends SpellListExtractorMixin {

  async customFunction(_options) {
    if (this.is2014) return;
    await this.generateSpellList("subclass");
  }

}


