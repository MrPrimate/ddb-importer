/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CircleOfTheMoonSpells extends DDBEnricherData {

  async customFunction(_options) {
    if (!game.user.isGM) return;

    const spellListFactory = new globalThis.DDBImporter.lib.SpellLists.SpellListFactory();
    await spellListFactory.init();

    spellListFactory.generateSpellUuidsForSourceAndSpellList('PHB 2024', 'Circle of the Moon', [
      'Cure Wounds',
      'Moonbeam',
      'Starry Wisp',
      'Conjure Animals',
      'Fount of Moonlight',
      'Mass Cure Wounds',
    ], ['is2024']);

    const source = spellListFactory.sources.find((s) => s.acronym === 'PHB 2024');
    await spellListFactory.buildSpellList(source, 'Circle of the Moon');
    await spellListFactory.registerSpellLists();
  }

}


