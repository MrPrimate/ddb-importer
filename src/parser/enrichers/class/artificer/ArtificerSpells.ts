import SpellListExtractorMixin from "../../data/SpellListExtractorMixin";

export default class ArtificerSpells extends SpellListExtractorMixin {

  async customFunction(_options) {
    await this.generateSpellList("subclass");
  }

}


