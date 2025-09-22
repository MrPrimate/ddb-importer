/* eslint-disable class-methods-use-this */
import SpellListExtractorMixin from "../../data/SpellListExtractorMixin.mjs";

export default class CircleOfTheSpells extends SpellListExtractorMixin {

  async customFunction(_options) {
    const name = this.name === "Circle Spells"
      ? `${this.ddbParser.subKlass} Circle Spells`
      : null;
    await this.generateSpellList("subclass", name);
  }

}


