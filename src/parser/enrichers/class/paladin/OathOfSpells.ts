import SpellListExtractorMixin from "../../data/SpellListExtractorMixin";

export default class OathOfSpells extends SpellListExtractorMixin {

  async customFunction(_options) {
    if (this.is2014) return;
    await this.generateSpellList("subclass");
  }

}


