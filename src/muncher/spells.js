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
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import { ExternalAutomations } from "../effects/_module.mjs";
import GenericSpellFactory from "../parser/spells/GenericSpellFactory.js";
import { DDBReferenceLinker } from "../parser/lib/_module.mjs";
import DDBSpellListFactory from "../parser/spells/DDBSpellListFactory.mjs";

function getSpellData({ className, sourceFilter, rulesVersion = null, notifier, searchFilter } = {}) {
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
  const sources = enableSources
    ? DDBSources.getSelectedSourceIds()
    : [];
  const exactMatch = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-exact-match");

  logger.debug(`Fetching Spells with:`, {
    debugJson,
    enableSources,
    sources,
    sourceFilter,
    exactMatch,
    rulesVersion,
    className,
    searchFilter,
  });

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/class/spells`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          FileHelper.download(JSON.stringify(data), `spells-raw.json`, "application/json");
        }
        if (!data.success) {
          notifier(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => {
        if (!sourceFilter) return data.data;
        const categorySpells = data.data
          .map((spell) => {
            spell.definition.sources = spell.definition.sources.filter((source) =>
              DDBSources.isSourceInAllowedCategory(source),
              // && source.sourceType === 1,
            );
            return spell;
          })
          .filter((spell) => {
            if (spell.definition.isHomebrew) return true;
            return spell.definition.sources.length > 0;
          });
        return categorySpells;
      })
      .then((data) => {
        if (sources.length == 0 || !sourceFilter) return data;
        return data.filter((spell) =>
          spell.definition.sources.some((source) => sources.includes(source.sourceId)),
        );
      })
      .then((data) => {
        if (sources.length > 0) return data;
        if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew-only")) {
          return data.filter((spell) => spell.definition.isHomebrew);
        } else if (!game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew")) {
          return data.filter((spell) => !spell.definition.isHomebrew);
        } else {
          return data;
        }
      })
      .then((data) => {
        if (!searchFilter || searchFilter === "") return data;
        if (exactMatch) {
          return data.filter((spell) => spell.definition.name.toLowerCase() === searchFilter.toLowerCase());
        }
        return data.filter((spell) => spell.definition.name.toLowerCase().includes(searchFilter.toLowerCase()));
      })
      .then((data) => resolve(data))
      .catch((error) => {
        logger.warn(error);
        reject(error);
      });
  });
}

export async function parseSpells({ ids = null, deleteBeforeUpdate = null, notifier = null, searchFilter = null } = {}) {

  await DDBReferenceLinker.importCacheLoad();
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

  const resolvedNotifier = notifier ?? utils.munchNote;
  // to speed up file checking we pregenerate existing files now.
  await FileHelper.generateCurrentFiles(uploadDirectory);

  if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
  }

  resolvedNotifier("Downloading spell data..");

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

  resolvedNotifier("Parsing spell data.");

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

  const rawSpells = await GenericSpellFactory.getSpells(filteredResults, resolvedNotifier);

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
  });
  await itemHandler.init();
  await itemHandler.srdFiddling();
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

  logger.debug({ finalSpells: itemHandler.documents, updateResults, updatePromiseResults });
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


