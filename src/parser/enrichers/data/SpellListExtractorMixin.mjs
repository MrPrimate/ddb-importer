import DDBEnricherData from "./DDBEnricherData.mjs";
import SpellListExtractor from "./SpellListExtractor.mjs";

export default class SpellListExtractorMixin extends DDBEnricherData {

  constructor({ ddbEnricher }) {
    super({ ddbEnricher });
    this.spellListExtractor = new SpellListExtractor({
      name: this.name,
      description: this.ddbParser.ddbDefinition.description,
      is2014: this.is2014,
      is2024: this.is2024,
      sourceId: this.ddbParser.ddbDefinition.sourceId,
    });
  }

  async generateSpellList(type = "class") {
    await this.spellListExtractor.generateSpellList(type);
  }

}
