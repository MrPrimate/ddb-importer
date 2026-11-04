import { DICTIONARY } from "../../config/_module";
import { DDBSources, utils } from "../../lib/_module";
import { DDBRuleJournalFactory } from "../../parser/lib/_module";
import SpellListFactory from "../../parser/spells/SpellListFactory";

type LanguageConfigNode = string | LanguageConfigCategory;

interface LanguageConfigCategory {
  label?: string;
  selectable?: boolean;
  children?: Record<string, LanguageConfigNode>;
}

/**
 * Map every language key in CONFIG.DND5E.languages (leaves and categories) to the path of the
 * categories above it, the form trait advancements use ("exotic:primordial" for aquan, "" for a
 * top level key). Modules such as Heroes of Faerun register their own languages here at init.
 */
function systemLanguagePaths(): Map<string, string> {
  const paths = new Map<string, string>();

  const walk = (key: string, data: LanguageConfigNode, parents: string[]) => {
    if (!paths.has(key)) paths.set(key, parents.join(":"));
    if (typeof data === "string" || !data.children) return;
    Object.entries(data.children).forEach(([k, d]) => walk(k, d, [...parents, key]));
  };

  for (const [key, data] of Object.entries(CONFIG.DND5E.languages as Record<string, LanguageConfigNode>)) {
    walk(key, data, []);
  }
  return paths;
}

/**
 * Sort the DDB language list into languages the system (or a module) already defines under the
 * same key, and rare languages it does not know.
 */
function filterLanguages(languages: IDDBConfigLanguage[]): {
  known: { name: string; value: string; advancement: string }[];
  rare: { name: string; value: string }[];
} {
  const systemPaths = systemLanguagePaths();
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

    const path = systemPaths.get(stub);
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

const LOOT_TYPES = {
  // DDB does not expose any mist talisman loot
  mistTalisman: "DND5E.Loot.MistTalisman",
};

function addFeatTypes() {
  for (const [key, value] of Object.entries(FEAT_TYPES)) {
    if (!foundry.utils.getProperty(CONFIG.DND5E, `featureTypes.feat.subtypes.${key}`)) {
      foundry.utils.setProperty(CONFIG.DND5E, `featureTypes.feat.subtypes.${key}`, value);
    }
  }
}

function addLootTypes() {
  for (const [key, value] of Object.entries(LOOT_TYPES)) {
    if (!foundry.utils.getProperty(CONFIG.DND5E, `lootTypes.${key}`)) {
      foundry.utils.setProperty(CONFIG.DND5E, `lootTypes.${key}`, value);
    }
  }
}

export default async function addDDBConfig() {
  addLanguages();
  DDBSources.addSourcesHook();
  addSpellLists();
  addFeatTypes();
  addLootTypes();
  // tattoos are injected elsewhere as they have apps and builder scripts
  await DDBRuleJournalFactory.registerAllWithWorld();
}
