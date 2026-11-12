import { DICTIONARY } from "../../config/_module";
import { DDBSources, utils } from "../../lib/_module";
import { DDBRuleJournalFactory, SystemHelpers } from "../../parser/lib/_module";
import SpellListFactory from "../../parser/spells/SpellListFactory";

/**
 * Sort the DDB language list into languages the system (or a module) already defines under the
 * same key, and rare languages it does not know.
 */
function filterLanguages(languages: IDDBConfigLanguage[]): {
  known: { name: string; value: string; advancement: string }[];
  rare: { name: string; value: string }[];
} {
  const systemTree = SystemHelpers.languageTree();
  const seen = new Set<string>();
  const known: { name: string; value: string; advancement: string }[] = [];
  const rare: { name: string; value: string }[] = [];

  for (const lang of languages) {
    const name = utils.nameString(lang.name);
    if (["All", "Telepathy"].includes(name)) continue;
    if (DICTIONARY.actor.languages.some((l) => l.name === name)) continue;
    const stub = utils.normalizeString(name);
    if (seen.has(stub)) continue;
    seen.add(stub);

    const path = systemTree.get(stub)?.parents;
    if (path === undefined) {
      rare.push({ name, value: stub });
    } else {
      // an empty advancement path (a top level key) makes consumers use the bare key
      known.push({ name, value: stub, advancement: path });
    }
  };
  return { known, rare };

}

export function addLanguages() {
  const ddbRaw = foundry.utils.getProperty(CONFIG, "DDB.languages") as IDDBConfigLanguage[] | undefined;
  if (!ddbRaw) return;

  const { known, rare } = filterLanguages(ddbRaw);

  // DDB languages a module already registers (Heroes of Faerun's Chondathan, Thayan...) map to
  // that key whether or not the rare language group is wanted.
  DICTIONARY.actor.languages.push(...known);

  if (!utils.getSetting<boolean>("add-ddb-languages")) return;
  const ddbLanguages = {
    label: "D&D Beyond Rare Languages",
    children: {} as Record<string, string>,
    selectable: false,
  };
  CONFIG.DND5E.languages.ddb = ddbLanguages;
  rare.forEach((lang) => {
    ddbLanguages.children[lang.value] = lang.name;
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

const FEAT_TYPES = {
  dragonmark: "Dragonmark Feat",
  darkGift: "Dark Gift",
  kindred: "Kindred",
};

function addFeatTypes() {
  for (const [key, value] of Object.entries(FEAT_TYPES)) {
    if (!foundry.utils.getProperty(CONFIG.DND5E, `featureTypes.feat.subtypes.${key}`)) {
      foundry.utils.setProperty(CONFIG.DND5E, `featureTypes.feat.subtypes.${key}`, value);
    }
  }
}

export default async function addDDBConfig() {
  addLanguages();
  DDBSources.addSourcesHook();
  addSpellLists();
  addFeatTypes();
  await DDBRuleJournalFactory.registerAllWithWorld();
}
