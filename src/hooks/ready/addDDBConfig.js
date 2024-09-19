import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import SETTINGS from "../../settings.js";

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

function addSources() {
  if (!game.settings.get(SETTINGS.MODULE_ID, "register-source-books")) return;

  const ddbRaw = foundry.utils.getProperty(CONFIG, "DDB.sources");
  if (!ddbRaw) return;

  const sources = {};
  for (const source of ddbRaw.filter((s) => s.isReleased && [1, 148, 145])) {
    sources[source.name] = source.description;
  }
  Object.assign(CONFIG.DND5E.sourceBooks, sources);
}

export default function addDDBConfig() {
  addLanguages();
  addSources();
}
