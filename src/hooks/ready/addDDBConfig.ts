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

interface LanguageGroup {
  label?: string;
  children: unknown[];
}

function filterLanguages(languages: IDDBConfigLanguage[]): { name: string; value: string }[] {
  const result = new Set<{ name: string; value: string }>();

  const systemLanguageValues = new Set<string>();

  const processCategory = (key: string, data: LanguageConfigNode, group: LanguageGroup | null = null) => {

    if (typeof data === "string" || !data.children) {
      systemLanguageValues.add(key);
      return;
    }

    if (data.selectable !== false) {
      systemLanguageValues.add(key);
      group ??= { label: data.label, children: [] };
      Object.entries(data.children).forEach(([k, d]) => processCategory(k, d, group));
    } else {
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
  if (!utils.getSetting<boolean>("add-ddb-languages")) return;
  const ddbRaw = foundry.utils.getProperty(CONFIG, "DDB.languages") as IDDBConfigLanguage[] | undefined;
  if (!ddbRaw) return;

  const ddbFiltered = filterLanguages(ddbRaw);

  const ddbLanguages = {
    label: "D&D Beyond Rare Languages",
    children: {} as Record<string, string>,
    selectable: false,
  };
  CONFIG.DND5E.languages.ddb = ddbLanguages;
  ddbFiltered.forEach((lang) => {
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
