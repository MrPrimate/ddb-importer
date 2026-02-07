/* eslint-disable class-methods-use-this */
import SpellListExtractorMixin from "../../data/SpellListExtractorMixin.mjs";

export default class RangerSpells extends SpellListExtractorMixin {

  async customFunction(_options) {
    await this.generateSpellList("subclass");
  }

}


