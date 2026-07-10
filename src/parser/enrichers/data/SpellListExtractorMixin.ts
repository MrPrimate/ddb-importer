import DDBEnricherData from "./DDBEnricherData";
import SpellListExtractor from "./SpellListExtractor";

export default class SpellListExtractorMixin extends DDBEnricherData {

  spellListExtractor: SpellListExtractor;

  constructor({ ddbEnricher }: { ddbEnricher: TDDBEnricher }) {
    super({ ddbEnricher });
    this.spellListExtractor = new SpellListExtractor({
      name: this.name,
      description: this.ddbParser.ddbDefinition.description,
      is2014: this.is2014,
      is2024: this.is2024,
      sourceId: foundry.utils.getProperty(this.ddbParser.ddbDefinition, "sourceId") as number,
    });
  }

  async generateSpellList(type = "class", name: string | null = null): Promise<void> {
    if (name) this.spellListExtractor.name = name;
    await this.spellListExtractor.generateSpellList(type);
  }

}
