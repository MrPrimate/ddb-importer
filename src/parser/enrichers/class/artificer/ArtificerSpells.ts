import SpellListExtractorMixin from "../../data/SpellListExtractorMixin";

export default class ArtificerSpells extends SpellListExtractorMixin {

  override async customFunction(_options: ICustomFunctionOptions) {
    await this.generateSpellList("subclass");
  }

}

