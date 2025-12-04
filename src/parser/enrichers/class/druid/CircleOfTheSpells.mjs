/* eslint-disable class-methods-use-this */
import SpellListExtractorMixin from "../../data/SpellListExtractorMixin.mjs";

export default class CircleOfTheSpells extends SpellListExtractorMixin {

  async customFunction(_options) {
    let name = null;
    if (this.name === "Circle Spells") {
      name = `${this.ddbParser.subKlass} Circle Spells`;
    } else if (this.name === "Additional Druid Spells") {
      name = `${this.ddbParser.klass} Additional Spells`;
    }

    await this.generateSpellList("subclass", name);
  }

}


