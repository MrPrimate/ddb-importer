import SpellListExtractorMixin from "../../data/SpellListExtractorMixin";

export default class ExtraSpells extends SpellListExtractorMixin {

  override async customFunction(_options: ICustomFunctionOptions) {
    if (this.is2014) return;
    await this.generateSpellList("subclass");
  }

}

