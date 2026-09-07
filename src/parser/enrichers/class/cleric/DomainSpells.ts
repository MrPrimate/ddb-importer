import SpellListExtractorMixin from "../../data/SpellListExtractorMixin";

export default class DomainSpells extends SpellListExtractorMixin {

  override async customFunction(_options: ICustomFunctionOptions) {
    if (this.is2014) return;
    await this.generateSpellList("subclass");
  }

}

