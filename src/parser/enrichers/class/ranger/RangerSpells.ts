import SpellListExtractorMixin from "../../data/SpellListExtractorMixin";

export default class RangerSpells extends SpellListExtractorMixin {

  async customFunction(_options: ICustomFunctionOptions) {
    await this.generateSpellList("subclass");
  }

}

