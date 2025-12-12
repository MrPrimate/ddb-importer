import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { DDBSources, utils } from "../../lib/_module.mjs";
import { DDBRuleJournalFactory } from "../../parser/lib/_module.mjs";
import SpellListFactory from "../../parser/spells/SpellListFactory.mjs";

function filterLanguages(languages) {
  const result = new Set();

  const systemLanguageValues = new Set();

  const processCategory = (key, data, group) => {

    if (!data.children) {
      systemLanguageValues.add(key);
    }

    if (data.children && (data.selectable !== false)) {
      systemLanguageValues.add(key);
      group ??= { label: data.label, children: [] };
      Object.entries(data.children).forEach(([k, d]) => processCategory(k, d, group));
    } else if (data.children) {
      Object.entries(data.children).forEach(([k, d]) => processCategory(k, d));
    }
  };

  for (const [key, data] of Object.entries(CONFIG.DND5E.languages)) {
    if (data.children) Object.entries(data.children).forEach(([k, d]) => processCategory(k, d));
    else processCategory(key, data);
  }

  for (const lang of languages) {
    const name = utils.nameString(lang.name);
    if (["All", "Telepathy"].includes(name)) continue;
    if (DICTIONARY.actor.languages.some((l) => l.name === name)) continue;
    const stub = utils.normalizeString(name);
    if (systemLanguageValues.has(stub)) continue;

    systemLanguageValues.add(stub);
    result.add({ name, value: stub });
  };
  return Array.from(result);

}

function addLanguages() {
  if (!game.settings.get(SETTINGS.MODULE_ID, "add-ddb-languages")) return;
  const ddbRaw = foundry.utils.getProperty(CONFIG, "DDB.languages");
  if (!ddbRaw) return;

  const ddbFiltered = filterLanguages(ddbRaw);

  CONFIG.DND5E.languages.ddb = {
    label: "D&D Beyond Rare Languages",
    children: {
    },
    selectable: false,
  };
  ddbFiltered.forEach((lang) => {
    CONFIG.DND5E.languages.ddb.children[lang.value] = lang.name;
    DICTIONARY.actor.languages.push({
      name: lang.name,
      value: lang.value,
      advancement: "ddb",
    });
  });
}

function addSpellLists() {
  const spellListFactory = new SpellListFactory();
  spellListFactory.registerSpellLists();
}

function addFeatTypes() {
  CONFIG.DND5E.featureTypes.feat.subtypes.dragonmark = "Dragonmark Feat";
}

export default async function addDDBConfig() {
  addLanguages();
  DDBSources.addSourcesHook();
  addSpellLists();
  addFeatTypes();
  await DDBRuleJournalFactory.registerAllWithWorld();
}
