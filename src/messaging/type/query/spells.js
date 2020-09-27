import utils from "../../../utils.js";

const querySpells = async (message) => {
  const GET_SPELL_ENTITIES = true;
  let compendium = await game.settings.get("ddb-importer", "entity-spell-compendium");

  if (Array.isArray(message.name)) {
    let details = await utils.queryCompendiumEntries(compendium, message.name, GET_SPELL_ENTITIES);
    // prepare the expected object
    let result = {};
    let idx = 0;
    for (let spellName of message.name) {
      result[spellName] = details[idx++];
    }
    return { spell: result };
  } else {
    const details = await utils.queryCompendiumEntry(compendium, message.name);
    return { spell: details };
  }
};

export default querySpells;
