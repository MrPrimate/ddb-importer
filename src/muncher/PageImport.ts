import { DDBSources, logger, PatreonHelper, Secrets, utils } from "../lib/_module";
import { speciesKey } from "../lib/SpeciesIdentity";
import DDBCharacter from "../parser/DDBCharacter";
import DDBAdventureBrowser from "../apps/DDBAdventureBrowser";
import DDBAdventures from "./DDBAdventures";
import DDBItemsImporter from "./DDBItemsImporter";
import DDBMuleHandler from "./DDBMuleHandler";
import { importMonsterFromPage } from "./MonsterPageImport";
import { parseSpells } from "./spells";

interface IPageImportResult {
  success: boolean;
  message: string;
  data?: unknown;
}
type TMuleListType = "feat" | "background" | "species" | "class";

let importQueue: InstanceType<typeof foundry.utils.Semaphore> | null = null;

const MULE_TYPE_LABELS: Record<TMuleListType, string> = {
  feat: "feat",
  background: "background",
  species: "species",
  class: "class",
};

/** The muncher's mule character, which feat, background, species and class imports run through. */
function getMuleCharacterId(): string | null {
  const url = utils.getSetting<string>("munching-policy-character-url") ?? "";
  return url ? DDBCharacter.getCharacterId(url) : null;
}

/**
 * Finds a feat, background, species or class in D&D Beyond's lists for this account. The page id
 * is the list entry's `id`, except for species, where it is the `entityRaceId`.
 */
async function findMuleEntry(type: TMuleListType, id: number): Promise<TDDBMuleGetList | null> {
  const allSources = CONFIG.DDB.sources.map((source) => source.id);
  const list = await DDBMuleHandler.getList<TDDBMuleGetList>(type, allSources);
  return list.find((entry) => (type === "species"
    ? (entry as IDDBMuleSpeciesDefinition).entityRaceId === id
    : (entry as IDDBMuleFeatDefinition).id === id)) ?? null;
}

function entryName(type: TMuleListType, entry: TDDBMuleGetList): string {
  return type === "species"
    ? (entry as IDDBMuleSpeciesDefinition).fullName ?? (entry as IDDBMuleSpeciesDefinition).baseName ?? "species"
    : (entry as IDDBMuleFeatDefinition).name;
}

/**
 * Imports a feat, background, species or class through the mule character, limited to that one
 * entry and the books it comes from. The mule always updates existing compendium entries.
 */
/**
 * The official subclasses D&D Beyond offers this account for a class, for the class import picker.
 * Homebrew subclasses are left out: the Muncher imports those in a separate homebrew pass.
 */
async function fetchClassSubclasses(klass: IDDBMuleClassDefinition): Promise<IDDBMuleSubclassDefinition[]> {
  const rulesVersion = klass.sources.every((source) => DDBSources.is2014Source(source)) ? "2014" : "2024";
  const campaignId = await DDBMuleHandler.getMuleCampaignId(getMuleCharacterId());
  const subclasses = await DDBMuleHandler.getSubclassesCached({
    className: klass.name,
    classId: klass.id,
    rulesVersion,
    includeHomebrew: false,
    campaignId,
  });
  return subclasses.filter((subclass) => !subclass.isHomebrew);
}

/**
 * Lists a class's subclasses with their source books, so the extension popup can ask which to
 * import.
 * @param payload `id`, the class id in the page URL
 * @returns `data`: `{ className, subclasses: [{ id, name, sourceIds }], sources: [{ id, name, description }] }`
 */
export async function getClassSubclasses(payload: Record<string, unknown>): Promise<IPageImportResult> {
  const status = await getPageImportStatus({ type: "class" });
  if (!status.success) return status;
  const id = Number(payload.id);
  const klass = await findMuleEntry("class", id) as IDDBMuleClassDefinition | null;
  if (!klass) return { success: false, message: `D&D Beyond did not list class ${id} for your account. Check you can access its book.` };

  const subclasses = await fetchClassSubclasses(klass);
  const sourceIds = new Set(subclasses.flatMap((subclass) => subclass.sources.map((source) => source.sourceId)));
  const sources = CONFIG.DDB.sources
    .filter((source) => sourceIds.has(source.id))
    .map((source) => ({ id: source.id, name: source.name, description: source.description }));
  return {
    success: true,
    message: `${subclasses.length} subclasses found.`,
    data: {
      className: klass.name,
      subclasses: subclasses
        .map((subclass) => ({ id: subclass.id, name: subclass.name, sourceIds: subclass.sources.map((source) => source.sourceId) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      sources,
    },
  };
}

/**
 * Imports a class with the chosen subclasses, mirroring the Muncher's class run: one mule run per
 * source category, each limited to that category's books that hold chosen subclasses. An empty
 * `filterIds` would mean every subclass to the mule, so at least one subclass is required.
 */
async function importClassWithSubclasses(klass: IDDBMuleClassDefinition, subclassIds: number[], characterId: string) {
  const offered = await fetchClassSubclasses(klass);
  const chosen = offered.filter((subclass) => subclassIds.includes(subclass.id));
  if (chosen.length === 0) throw new Error("None of the chosen subclasses are offered for this class any more.");

  const runs = new Map<number, { sources: Set<number>; filterIds: Set<number> }>();
  for (const subclass of chosen) {
    // grouped by the primary book only, so a subclass also listed in a reprint is munched once
    const sourceId = (subclass.sources.find((source) => source.sourceType === 1) ?? subclass.sources[0])?.sourceId;
    if (sourceId === undefined) continue;
    const categoryId = CONFIG.DDB.sources.find((source) => source.id === sourceId)?.sourceCategoryId ?? 0;
    const run = runs.get(categoryId) ?? { sources: new Set<number>(), filterIds: new Set<number>() };
    run.sources.add(sourceId);
    run.filterIds.add(subclass.id);
    runs.set(categoryId, run);
  }
  for (const run of runs.values()) {
    await DDBMuleHandler.munchClass({
      classId: klass.id,
      characterId,
      sources: [...run.sources],
      homebrew: false,
      filterIds: [...run.filterIds],
    });
  }
  return chosen.length;
}

async function importMuleEntry(type: TMuleListType, id: number, subclassIds: number[] = []): Promise<IPageImportResult> {
  const characterId = getMuleCharacterId();
  if (!characterId) {
    return {
      success: false,
      message: `Adding a ${MULE_TYPE_LABELS[type]} needs the mule character: set its D&D Beyond URL on the Muncher's Classes, Feats, Backgrounds and Species tab first.`,
    };
  }
  const entry = await findMuleEntry(type, id);
  if (!entry) {
    return { success: false, message: `D&D Beyond did not list ${MULE_TYPE_LABELS[type]} ${id} for your account. Check you can access its book.` };
  }
  const name = entryName(type, entry);
  const sources = [...new Set(entry.sources.map((source) => source.sourceId))];
  const homebrew = Boolean(entry.isHomebrew);
  ui.notifications.info(`Adding ${name} from D&D Beyond...`);

  switch (type) {
    case "feat":
      await DDBMuleHandler.munchFeats({ characterId, sources, homebrew, filterIds: [id] });
      break;
    case "background":
      await DDBMuleHandler.munchBackgrounds({ characterId, sources, homebrew, filterIds: [id] });
      break;
    case "species": {
      const key = speciesKey(entry as IDDBMuleSpeciesDefinition);
      if (!key) return { success: false, message: `D&D Beyond's entry for ${name} has no species key.` };
      await DDBMuleHandler.munchSpecies({ characterId, sources, homebrew, speciesKeys: [key] });
      break;
    }
    case "class": {
      const count = await importClassWithSubclasses(entry as IDDBMuleClassDefinition, subclassIds, characterId);
      const message = `Added ${name} with ${count} subclass${count === 1 ? "" : "es"} to the compendiums.`;
      ui.notifications.info(message);
      return { success: true, message };
    }
    // no default
  }
  const message = `Added ${name} to the compendiums.`;
  ui.notifications.info(message);
  return { success: true, message };
}

async function importSpell(id: number, name: string): Promise<IPageImportResult> {
  ui.notifications.info(`Adding ${name} from D&D Beyond...`);
  const results = await parseSpells({ ids: [id], forceUpdate: true });
  if (!results?.length) {
    return { success: false, message: `D&D Beyond returned no spell ${id}. Check you can access its book.` };
  }
  const message = `Added ${name} to the spell compendium.`;
  ui.notifications.info(message);
  return { success: true, message };
}

async function importItem(id: number, name: string): Promise<IPageImportResult> {
  ui.notifications.info(`Adding ${name} from D&D Beyond...`);
  const results = (await DDBItemsImporter.fetchAndImportItems({ ids: [id], forceUpdate: true }))?.filter(Boolean) ?? [];
  if (results.length === 0) {
    return { success: false, message: `D&D Beyond returned no item ${id}. Check you can access its book.` };
  }
  const message = `Added ${name} to the item compendium.`;
  ui.notifications.info(message);
  return { success: true, message };
}

const MULE_TYPES = new Set(["feat", "background", "species", "class"]);
const PAGE_TYPES = new Set(["monster", "spell", "item", "adventure", ...MULE_TYPES]);

/**
 * The D&D Beyond book a sources page belongs to, from the start of its path: the index page
 * (`sources/dnd/au`) and every chapter page under it (`sources/dnd/au/chapter-5-magic-items`)
 * match the book's `sourceURL`.
 * @param path the page path, with or without a leading slash
 */
function findBookForPath(path: string): IDDBConfigSource | null {
  const segments = path.replace(/^\/+/, "").split(/[/?#]/).filter(Boolean);
  if (segments[0] !== "sources" || segments.length < 3) return null;
  const bookPath = segments.slice(0, 3).join("/");
  return CONFIG.DDB.sources.find((source) => source.sourceURL.replace(/^\/+|\/+$/g, "") === bookPath) ?? null;
}

/** Whether the account owns the book; true when D&D Beyond's owned list cannot be fetched. */
async function ownsBook(bookId: number): Promise<boolean> {
  const owned = await DDBAdventures.fetchOwnedBookIds().catch(() => null);
  return owned?.bookIds ? owned.bookIds.includes(bookId) : true;
}

/**
 * Whether this client can import a page of the given type, with the reason when it cannot. The
 * same rules gate the Muncher's buttons: a Cobalt cookie for everything, the monster tier (all)
 * for monsters, the mule tier (experimentalMid) and a mule character for feats, backgrounds,
 * species and classes. Compendium writes also need a GM.
 * @param payload `type` (monster, spell, item, feat, background, species, class)
 * @returns `success` true when the import can run, otherwise `message` says what is missing
 */
export async function getPageImportStatus(payload: Record<string, unknown>): Promise<IPageImportResult> {
  const type = String(payload.type ?? "");
  if (!PAGE_TYPES.has(type)) return { success: false, message: `DDB Importer cannot add "${type}" pages.` };
  if (!game.user.isGM) return { success: false, message: "Open Foundry as a GM to import into compendiums." };
  if (Secrets.getCobalt() === "") {
    return { success: false, message: "DDB Importer has no Cobalt cookie. Add it in DDB Importer's settings, or let it use this browser's D&D Beyond login." };
  }
  const tiers = PatreonHelper.calculateAccessMatrix(PatreonHelper.getPatreonTier() ?? "");
  if (type === "monster" && !tiers.all) {
    return { success: false, message: "Monster imports need a linked DDB Importer Patreon key. Add it in DDB Importer's settings." };
  }
  if (MULE_TYPES.has(type)) {
    if (!tiers.experimentalMid) {
      const label = MULE_TYPE_LABELS[type as TMuleListType];
      return { success: false, message: `${label.charAt(0).toUpperCase()}${label.slice(1)} imports need a higher DDB Importer Patreon tier.` };
    }
    if (!getMuleCharacterId()) {
      return { success: false, message: "Set the mule character's D&D Beyond URL on the Muncher's Classes, Feats, Backgrounds and Species tab first." };
    }
  }
  if (type === "adventure") {
    const book = findBookForPath(String(payload.path ?? ""));
    if (!book) return { success: false, message: "DDB Importer does not know this D&D Beyond book." };
    if (!(await ownsBook(book.id))) {
      return { success: false, message: `Your D&D Beyond account does not own ${book.description}.` };
    }
    return { success: true, message: "Ready to add.", data: { name: book.description } };
  }
  return { success: true, message: "Ready to add." };
}

/**
 * Starts a book import in DDB Importer's adventure browser, which shows its progress in Foundry,
 * with the adventure-policy settings it uses for its own import buttons. Book imports run for a
 * long time and may ask which scenes to import, so the extension only waits for the request to be
 * accepted.
 */
async function openAdventureImport(path: string): Promise<IPageImportResult> {
  const book = findBookForPath(path);
  if (!book) return { success: false, message: "DDB Importer does not know this D&D Beyond book." };
  const browser = new DDBAdventureBrowser();
  await browser.render({ force: true });
  void DDBAdventureBrowser.importAdventure.call(browser, null, { dataset: { bookId: String(book.id) } });
  return { success: true, message: `Adding ${book.description} to Foundry.` };
}

/**
 * Imports or reimports one D&D Beyond entry into DDB Importer's compendiums from its page, sent by
 * the DDBI Utilities browser extension. Existing compendium entries are always updated.
 * @param payload `type` (monster, spell, item, feat, background, species, class, adventure), `id`
 * (the id in the page URL), `name` (the page title, for messages); monsters also carry `html` and
 * `biography` for MonsterPageImport, adventures carry the page `path` instead of an id
 * @returns the outcome shown in the extension popup
 */
export async function importFromPage(payload: Record<string, unknown>): Promise<IPageImportResult> {
  // the popup checks this before enabling its buttons, but it may be stale by the time one is pressed
  const status = await getPageImportStatus(payload);
  if (!status.success) return status;
  const type = String(payload.type ?? "");
  if (type === "adventure") return openAdventureImport(String(payload.path ?? ""));
  const id = Number(payload.id);
  const name = typeof payload.name === "string" && payload.name !== "" ? payload.name : `${type} ${id}`;
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: "The page did not give a valid id." };
  }

  importQueue ??= new foundry.utils.Semaphore(1);
  return importQueue.add(async () => {
    try {
      switch (type) {
        case "monster":
          return await importMonsterFromPage({ ...payload, monsterId: id });
        case "spell":
          return await importSpell(id, name);
        case "item":
          return await importItem(id, name);
        case "feat":
        case "background":
        case "species":
        case "class": {
          const subclassIds = Array.isArray(payload.subclassIds) ? payload.subclassIds.map(Number).filter(Number.isInteger) : [];
          if (subclassIds.length === 0) return { success: false, message: "Choose at least one subclass to import." };
          return await importMuleEntry(type, id, subclassIds);
        }
        default:
          return { success: false, message: `DDB Importer cannot import "${type}" pages.` };
      }
    } catch (error) {
      logger.error(`Page import of ${type} ${id} failed`, error);
      const message = `Adding ${name} failed: ${error instanceof Error ? error.message : String(error)}`;
      ui.notifications.error(message);
      return { success: false, message };
    }
  }) as Promise<IPageImportResult>;
}
