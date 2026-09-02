// Main module class
import {
  utils,
  logger,
  DDBCampaigns,
  Secrets,
  FileHelper,
  PatreonHelper,
  DDBProxy,
  Iconizer,
  DDBItemImporter,
  DDBMacros,
  DDBCompendiumFolders,
  DDBSources,
  SourceFilters,
  postJson,
} from "../lib/_module";
import { ExternalAutomations } from "../effects/_module";
import GenericSpellFactory from "../parser/spells/GenericSpellFactory";
import { DDBReferenceLinker } from "../parser/lib/_module";
import DDBSpellListFactory from "../parser/spells/DDBSpellListFactory";
import DDBSpellSocket, { DDBSpellEvent } from "../lib/streaming/DDBSpellSocket";

/**
 * Dev-only capture buffer.
 */
const _rawSpellFiles: { name: string; content: string }[] = [];

/**
 * Dev-only: bucket the unfiltered class spell payload into one file per DDB
 * source book, so a single proxy block can be worked on book by book.
 */
function collectRawSpellsBySource(raw: IDDBSpellEntry[], className: string, rulesVersion: string) {
  if (!CONFIG.DDBI.DEV.downloadRAWJSONExamples) return;
  const grouped = DDBSources.groupBySourceIds(raw, (spell) => spell.definition);
  for (const [sourceId, spells] of grouped) {
    const sourceName = sourceId === DDBSources.UNKNOWN_SOURCE_ID ? "unknown" : String(sourceId);
    _rawSpellFiles.push({
      name: `RAW-spells-${className}-${rulesVersion}-${sourceName}.json`,
      content: JSON.stringify({ success: true, className, rulesVersion, sourceId, data: spells }),
    });
  }
}

/** Ship everything collectRawSpellsBySource gathered as a single zip. */
async function downloadCollectedRawSpells() {
  if (_rawSpellFiles.length === 0) return;
  const files = _rawSpellFiles.splice(0, _rawSpellFiles.length);
  // log the manifest, so a book missing from the zip can be told apart from a
  // book that was never in the payload
  logger.info(`Dumping ${files.length} RAW spell files`, files.map((file) => file.name));
  await FileHelper.downloadZip(files, "RAW-spells.zip");
}

interface IGetSpellDataHttpOptions {
  className: string;
  sourceFilter: boolean;
  rulesVersion?: string | null;
  notifier?: (message: string) => void;
  searchFilter?: string;
  sourcesOverride?: number[] | null;
}

function getSpellDataHttp({ className, sourceFilter, rulesVersion = null, notifier, searchFilter, sourcesOverride = null }: IGetSpellDataHttpOptions) {
  const cobaltCookie = Secrets.getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = {
    cobalt: cobaltCookie,
    campaignId,
    betaKey,
    className,
    rulesVersion: rulesVersion ?? "2014",
  };
  const debugJson = utils.getSetting<boolean>("debug-json");
  // explicit sourcesOverride (e.g. from the native adventure importer) wins over the setting
  const sources = sourcesOverride ?? DDBSources.getBookFilter().effective;
  const effectiveSourceFilter = sourcesOverride !== null ? true : sourceFilter;
  const exactMatch = utils.getSetting<boolean>("munching-policy-spell-exact-match");

  logger.debug(`Fetching Spells (HTTP) with:`, {
    debugJson, sources, sourceFilter: effectiveSourceFilter, exactMatch,
    rulesVersion, className, searchFilter,
  });

  return new Promise<ClassSpellSet>((resolve, reject) => {
    postJson(`${parsingApi}/proxy/class/spells`, body)
      .then((data: IDDBClassSpellsProxyResponse) => {
        if (debugJson) {
          FileHelper.download(JSON.stringify(data), `spells-raw.json`, "application/json");
        }
        if (!data.success) {
          notifier?.(`Failure: ${data.message}`);
          reject(data.message);
          return null;
        }
        return data.data;
      })
      .then((raw) => {
        if (raw == null) return;
        collectRawSpellsBySource(raw, className, rulesVersion ?? "2014");
        const { data, counts } = SourceFilters.applySpellFilters(raw, { sourceFilter: effectiveSourceFilter, sources, exactMatch, searchFilter });
        logger.debug(`[spells] ${className} (${rulesVersion ?? "2014"}) filter stages`, counts);
        resolve({ className, rulesVersion: rulesVersion ?? "2014", spellData: data, counts });
      })
      .catch((error) => {
        logger.warn(error);
        reject(error);
      });
  });
}

interface ClassSpellSet {
  className: string;
  rulesVersion: string;
  spellData: IDDBSpellEntry[];
  counts: SourceFilters.ISourceFilterCounts;
}

interface IStreamAllClassSpellsOptions {
  sourceFilter: boolean;
  searchFilter: string;
  sourcesOverride?: number[] | null;
}

// Stream every class' spells over a SINGLE reused socket connection: connect +
// auth once, then issue one `class-spells` job per class on the same socket.
// Replaces the old per-class connect/auth/start/close churn (~24 connections).
async function streamAllClassSpells({ sourceFilter, searchFilter, sourcesOverride = null }: IStreamAllClassSpellsOptions): Promise<ClassSpellSet[]> {
  const cobaltCookie = Secrets.getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();

  const debugJson = utils.getSetting<boolean>("debug-json");
  // explicit sourcesOverride wins over the setting
  const sources = sourcesOverride ?? DDBSources.getBookFilter().effective;
  const effectiveSourceFilter = sourcesOverride !== null ? true : sourceFilter;
  const exactMatch = utils.getSetting<boolean>("munching-policy-spell-exact-match");

  const socket = new DDBSpellSocket(parsingApi);
  socket.connect();

  const out: ClassSpellSet[] = [];
  const debugDump: any[] = [];

  try {
    const authRes = await socket.auth({ betaKey, cobalt: cobaltCookie, characterId: null, campaignId });
    if (!authRes.ok) throw new Error(`Auth failed: ${authRes.message}`);

    for (const [rulesVersion, klassNames] of Object.entries(DDBSpellListFactory.CLASS_NAMES_MAP)) {
      const rules = rulesVersion ?? "2014";
      for (const className of klassNames) {
        logger.debug(`Streaming Spells with:`, {
          debugJson, sources, sourceFilter: effectiveSourceFilter,
          exactMatch, rulesVersion: rules, className, searchFilter,
        });

        let raw: IDDBSpellEntry[] = [];
        await socket.runJob(
          "class-spells",
          { className, rulesVersion: rules, campaignId, cobalt: cobaltCookie },
          {
            timeoutMs: 30000,
            onEvent: (event: DDBSpellEvent) => {
              if (event.kind === "classSpells") {
                const payload = event.payload ?? {};
                if (Array.isArray(payload.spells)) raw = payload.spells;
              }
            },
          },
        );

        if (debugJson) debugDump.push(...raw);
        collectRawSpellsBySource(raw, className, rules);
        const { data, counts } = SourceFilters.applySpellFilters(raw, { sourceFilter: effectiveSourceFilter, sources, exactMatch, searchFilter });
        logger.debug(`[spells] ${className} (${rules}) filter stages`, counts);
        out.push({ className, rulesVersion: rules, spellData: data, counts });
      }
    }
  } finally {
    socket.close();
  }

  if (debugJson) {
    FileHelper.download(JSON.stringify({ success: true, data: debugDump }), `spells-raw.json`, "application/json");
  }

  return out;
}

// Custom proxies may not expose the /spells socket namespace. Try the streaming
// path first; on connect/auth/start failure fall through to the HTTP endpoint.
let _spellSocketDisabled = false;

interface IParseSpellsOptions {
  ids?: (string | number)[] | null;
  deleteBeforeUpdate?: boolean | null;
  notifier?: NotifierV1 | null;
  notifierV2?: INotifierV2 | null;
  searchFilter?: string | null;
  sources?: number[] | null;
}

export async function parseSpells({
  ids = null,
  deleteBeforeUpdate = null,
  notifier = null,
  notifierV2 = null,
  searchFilter = null,
  sources = null,
}: IParseSpellsOptions = {}) {
  await DDBReferenceLinker.importCacheLoad();
  const updateBool = utils.getSetting<boolean>("munching-policy-update-existing");
  const uploadDirectory = utils.getSetting<string>("other-image-upload-directory").replace(/^\/|\/$/g, "");

  const resolvedNotifier = notifier ?? utils.munchNote;
  // to speed up file checking we pregenerate existing files now.
  await FileHelper.generateCurrentFiles(uploadDirectory);

  if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
    CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
  }

  resolvedNotifier("Downloading spell data...");

  // disable source filter if ids provided; explicit `sources` (override) wins → force on
  const sourceFilter = sources && sources.length > 0
    ? true
    : !(ids !== null && ids.length > 0);
  // an explicit source or id list is a programmatic caller (adventure import), not the muncher UI
  if (sources === null && !(ids !== null && ids.length > 0)) {
    SourceFilters.preflightSourceSettings("spells", resolvedNotifier);
  }
  const results: IDDBSpellEntry[] = [];
  const stageCounts: SourceFilters.ISourceFilterCounts[] = [];
  const spellListFactory = new DDBSpellListFactory();

  // Prefer streaming all classes over one reused socket. On any streaming
  // failure latch off and fall back to one HTTP request per class.
  let classSpellSets: ClassSpellSet[] | null = null;
  if (!_spellSocketDisabled) {
    try {
      classSpellSets = await streamAllClassSpells({ sourceFilter, searchFilter: searchFilter ?? "", sourcesOverride: sources });
    } catch (err) {
      logger.warn(`[spells] streaming failed, falling back to HTTP: ${(err as Error)?.message ?? String(err)}`);
      _spellSocketDisabled = true;
    }
  }

  if (classSpellSets) {
    for (const { className, spellData, counts } of classSpellSets) {
      spellListFactory.extractClassSpellListData(className, spellData);
      results.push(...spellData);
      stageCounts.push(counts);
    }
  } else {
    for (const [rulesVersion, klassNames] of Object.entries(DDBSpellListFactory.CLASS_NAMES_MAP)) {
      for (const className of klassNames) {
        const { spellData, counts } = await getSpellDataHttp({
          className,
          sourceFilter,
          notifier: resolvedNotifier,
          rulesVersion,
          searchFilter: searchFilter ?? "",
          sourcesOverride: sources,
        });
        spellListFactory.extractClassSpellListData(className, spellData);
        results.push(...spellData);
        stageCounts.push(counts);
      }
    }
  }

  await downloadCollectedRawSpells();
  SourceFilters.reportFilterResult("spells", SourceFilters.sumCounts(stageCounts), resolvedNotifier);

  resolvedNotifier("Parsing spell data...");

  const filteredResults = results
    .filter((v, i, a) => a.findIndex((t) =>
      t.definition.name === v.definition.name
      && t.definition.isLegacy === v.definition.isLegacy) === i);

  // console.warn("CONDITION SPELLS", {
  //   spells: filteredResults.filter((f) => {
  //     return f.definition.conditions?.length > 0;
  //   }).map((f) => {
  //     return {
  //       name: f.definition.name,
  //       conditions: f.definition.conditions,
  //     }
  //   })
  // });

  const rawSpells = await GenericSpellFactory.getSpells(filteredResults, resolvedNotifier, null, notifierV2);

  const spells = rawSpells
    .filter((spell) => spell?.name)
    .map((spell) => {
      spell.name = utils.nameString(spell.name);
      return spell;
    });

  await Iconizer.preFetchDDBIconImages();

  const uniqueSpells = spells.filter((v, i, a) => a.findIndex((t) => t.name === v.name
    && t.flags.ddbimporter?.is2014 === v.flags.ddbimporter?.is2014
    && t.flags.ddbimporter?.is2024 === v.flags.ddbimporter?.is2024) === i);

  const itemHandler = new DDBItemImporter<I5eSpellItem>("spells", uniqueSpells, {
    deleteBeforeUpdate,
    matchFlags: ["is2014", "is2024"],
    notifier: resolvedNotifier,
    notifierV2,
  });
  await itemHandler.init();
  await itemHandler.iconAdditions();
  const filteredSpells = (ids !== null && ids.length > 0)
    ? (itemHandler.documents).filter((s) => {
      const definitionId = s.flags?.ddbimporter?.definitionId;
      return definitionId && ids.includes(String(definitionId));
    })
    : itemHandler.documents;
  itemHandler.documents = await ExternalAutomations.applyChrisPremadeEffects({ documents: filteredSpells, compendiumItem: true }) as I5eSpellItem[];

  const finalCount = itemHandler.documents.length;
  resolvedNotifier(`Importing ${finalCount} spells...`, { nameField: true });
  logger.time("Spell Import Time");

  await itemHandler.compendiumFolders.loadCompendium("spells", true);
  await itemHandler.compendiumFolders.createSpellFoldersForDocuments({ documents: itemHandler.documents });

  const updateResults = await itemHandler.updateCompendium(updateBool);
  const updatePromiseResults = await Promise.all(updateResults as unknown as PromiseSettledResult<Item.Implementation | RollTable.Implementation>[]);

  logger.debug(`Spell Import Complete`, { finalSpells: itemHandler.documents, updateResults, updatePromiseResults });
  resolvedNotifier("");
  logger.timeEnd("Spell Import Time");

  await DDBCompendiumFolders.cleanupCompendiumFolders("spells", resolvedNotifier);

  logger.debug("Starting Spell List Generation");
  resolvedNotifier(`Generating Spell List Journals...`, { nameField: true });
  await spellListFactory.buildClassSpellLists();
  await spellListFactory.registerSpellLists();
  logger.debug("Spell List Generation Complete");

  return updateResults;
}

