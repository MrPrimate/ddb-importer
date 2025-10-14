/* eslint-disable class-methods-use-this */
import SpellListExtractorMixin from "../../data/SpellListExtractorMixin.mjs";

export default class ArtificerSpells extends SpellListExtractorMixin {

  async customFunction(_options) {
    await this.generateSpellList("subclass");
  }

}


