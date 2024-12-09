import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { DDBSources, utils } from "../../lib/_module.mjs";
import SpellListFactory from "../../parser/spells/SpellListFactory.mjs";

function addLanguages() {
  if (!game.settings.get(SETTINGS.MODULE_ID, "add-ddb-languages")) return;
  const ddbRaw = foundry.utils.getProperty(CONFIG, "DDB.languages");
  if (!ddbRaw) return;

  const ddbFiltered = [...new Set(ddbRaw
    .map((lang) => utils.nameString(lang.name))
    .filter((lang) =>
      !DICTIONARY.character.languages.some((l) => l.name === lang)
      && !["All"].includes(lang),
    ))];

  CONFIG.DND5E.languages.ddb = {
    label: "D&D Beyond Rare Languages",
    children: {
    },
  };
  ddbFiltered.forEach((lang) => {
    const stub = utils.normalizeString(lang);
    CONFIG.DND5E.languages.ddb.children[stub] = lang;
    DICTIONARY.character.languages.push({
      name: lang,
      value: stub,
      advancement: "ddb",
    });
  });
}

function addSpellLists() {
  const spellListFactory = new SpellListFactory();
  spellListFactory.registerSpellLists();
}

export default function addDDBConfig() {
  addLanguages();
  DDBSources.addSourcesHook();
  addSpellLists();
}
