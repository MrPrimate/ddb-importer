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
} from "../lib/_module";
import { SETTINGS } from "../config/_module";
import { ExternalAutomations } from "../effects/_module";
import GenericSpellFactory from "../parser/spells/GenericSpellFactory";
import { DDBReferenceLinker } from "../parser/lib/_module";
import DDBSpellListFactory from "../parser/spells/DDBSpellListFactory";
import DDBSpellSocket, { DDBSpellEvent } from "../lib/streaming/DDBSpellSocket";

function applySpellFilters(raw, { sourceFilter, sources, exactMatch, searchFilter }) {
  let data = raw;
  if (sourceFilter) {
    data = data
      .map((spell) => {
        spell.definition.sources = spell.definition.sources.filter((source) =>
          DDBSources.isSourceInAllowedCategory(source),
        );
        return spell;
      })
      .filter((spell) => {
        if (spell.definition.isHomebrew) return true;
        return spell.definition.sources.length > 0;
      });
  }
  if (sources.length > 0 && sourceFilter) {
    data = data.filter((spell) =>
      spell.definition.sources.some((source) => sources.includes(source.sourceId)),
    );
  } else if (sources.length === 0) {
    if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew-only")) {
      data = data.filter((spell) => spell.definition.isHomebrew);
    } else if (!game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew")) {
      data = data.filter((spell) => !spell.definition.isHomebrew);
    }
  }
  if (searchFilter && searchFilter !== "") {
    if (exactMatch) {
      data = data.filter((spell) => spell.definition.name.toLowerCase() === searchFilter.toLowerCase());
    } else {
      data = data.filter((spell) => spell.definition.name.toLowerCase().includes(searchFilter.toLowerCase()));
    }
  }
  return data;
}

function getSpellDataHttp({ className, sourceFilter, rulesVersion = null, notifier, searchFilter } = {}) {
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
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");
  const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
  const sources = enableSources ? DDBSources.getSelectedSourceIds() : [];
  const exactMatch = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-exact-match");

  logger.debug(`Fetching Spells (HTTP) with:`, {
    debugJson, enableSources, sources, sourceFilter, exactMatch,
    rulesVersion, className, searchFilter,
  });

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/class/spells`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
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
        resolve(applySpellFilters(raw, { sourceFilter, sources, exactMatch, searchFilter }));
      })
      .catch((error) => {
        logger.warn(error);
        reject(error);
      });
  });
}

function getSpellDataStreaming({ className, sourceFilter, rulesVersion = null, notifier: _notifier, searchFilter } = {}) {
  const cobaltCookie = Secrets.getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const rules = rulesVersion ?? "2014";

  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");
  const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
  const sources = enableSources ? DDBSources.getSelectedSourceIds() : [];
  const exactMatch = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-exact-match");

  logger.debug(`Streaming Spells with:`, {
    debugJson,
    enableSources,
    sources,
    sourceFilter,
    exactMatch,
    rulesVersion: rules,
    className,
    searchFilter,
  });

  return new Promise((resolve, reject) => {
    const socket = new DDBSpellSocket(parsingApi);
    let raw: any[] = [];
    let settled = false;
    let timer: any = null;

    const finish = (err: Error | null, data: any[] | null) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      socket.close();
      if (err) reject(err);
      else resolve(data);
    };

    socket.connect({
      onEvent: (event: DDBSpellEvent) => {
        if (event.kind === "classSpells") {
          const payload = event.payload ?? {};
          if (Array.isArray(payload.spells)) raw = payload.spells;
        }
      },
      onError: (message, fatal) => {
        if (fatal) finish(new Error(message), null);
        else logger.warn(`[DDBSpellSocket] non-fatal error: ${message}`);
      },
      onDone: () => {
        if (debugJson) {
          FileHelper.download(
            JSON.stringify({ success: true, data: raw }),
            `spells-raw.json`,
            "application/json",
          );
        }
        finish(null, applySpellFilters(raw, { sourceFilter, sources, exactMatch, searchFilter }));
      },
      onConnectError: (err) => finish(err, null),
    });

    timer = setTimeout(() => {
      finish(new Error("Spell socket timed out"), null);
    }, 30000);

    (async () => {
      try {
        const authRes = await socket.auth({ betaKey, cobalt: cobaltCookie, characterId: null, campaignId });
        if (!authRes.ok) throw new Error(`Auth failed: ${authRes.message}`);
        const startRes = await socket.start("class-spells", {
          className,
          rulesVersion: rules,
          campaignId,
          cobalt: cobaltCookie,
        });
        if (!startRes.ok) throw new Error(`Start failed: ${startRes.message}`);
        logger.debug(`[DDBSpellSocket] jobId=${startRes.jobId} replayed=${startRes.replayed} className=${className} rulesVersion=${rules}`);
      } catch (err) {
        finish(err as Error, null);
      }
    })();
  });
}

// Custom proxies may not expose the /spells socket namespace. Try the streaming
// path first; on connect/auth/start failure fall through to the HTTP endpoint.
let _spellSocketDisabled = false;

async function getSpellData(args) {
  if (!_spellSocketDisabled) {
    try {
      return await getSpellDataStreaming(args);
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      logger.warn(`[spells] streaming failed, falling back to HTTP: ${msg}`);
      _spellSocketDisabled = true;
    }
  }
  return getSpellDataHttp(args);
}

export async function parseSpells({ ids = null, deleteBeforeUpdate = null, notifier = null, notifierV2 = null, searchFilter = null } = {}) {

  await DDBReferenceLinker.importCacheLoad();
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

  const resolvedNotifier = notifier ?? utils.munchNote;
  // to speed up file checking we pregenerate existing files now.
  await FileHelper.generateCurrentFiles(uploadDirectory);

  if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
    CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
  }

  resolvedNotifier("Downloading spell data...");

  // disable source filter if ids provided
  const sourceFilter = !(ids !== null && ids.length > 0);
  const results = [];
  const spellListFactory = new DDBSpellListFactory();

  for (const [rulesVersion, klassNames] of Object.entries(DDBSpellListFactory.CLASS_NAMES_MAP)) {
    for (const className of klassNames) {
      const spellData = await getSpellData({
        className,
        sourceFilter,
        notifier: resolvedNotifier,
        rulesVersion,
        searchFilter,
      });
      spellListFactory.extractClassSpellListData(className, spellData);
      results.push(...spellData);
    }
  }

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
    && t.flags.ddbimporter.is2014 === v.flags.ddbimporter.is2014
    && t.flags.ddbimporter.is2024 === v.flags.ddbimporter.is2024) === i);

  const itemHandler = new DDBItemImporter("spells", uniqueSpells, {
    deleteBeforeUpdate,
    matchFlags: ["is2014", "is2024"],
    notifier: resolvedNotifier,
    notifierV2,
  });
  await itemHandler.init();
  await itemHandler.iconAdditions();
  const filteredSpells = (ids !== null && ids.length > 0)
    ? itemHandler.documents.filter((s) => s.flags?.ddbimporter?.definitionId && ids.includes(String(s.flags.ddbimporter.definitionId)))
    : itemHandler.documents;
  itemHandler.documents = await ExternalAutomations.applyChrisPremadeEffects({ documents: filteredSpells, compendiumItem: true });

  const finalCount = itemHandler.documents.length;
  resolvedNotifier(`Importing ${finalCount} spells...`, { nameField: true });
  logger.time("Spell Import Time");

  await itemHandler.compendiumFolders.loadCompendium("spells", true);
  await itemHandler.compendiumFolders.createSpellFoldersForDocuments({ documents: itemHandler.documents });

  const updateResults = await itemHandler.updateCompendium(updateBool);
  const updatePromiseResults = await Promise.all(updateResults);

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

