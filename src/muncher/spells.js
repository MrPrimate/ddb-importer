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
import SpellListFactory from "../parser/spells/SpellListFactory.mjs";

function getSpellData({ className, sourceFilter, rulesVersion = null, notifier } = {}) {
  const cobaltCookie = Secrets.getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const excludeLegacy = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-exclude-legacy");
  const body = {
    cobalt: cobaltCookie,
    campaignId,
    betaKey,
    className,
    rulesVersion: rulesVersion ?? (excludeLegacy ? "2024" : "2014"),
  };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");
  const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
  const sources = enableSources
    ? DDBSources.getSelectedSourceIds()
    : [];

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
      .then((data) => resolve(data))
      .catch((error) => {
        logger.warn(error);
        reject(error);
      });
  });
}

export async function parseSpells({ ids = null, deleteBeforeUpdate = null, notifier = null } = {}) {
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

  const resolvedNotifier = notifier ?? utils.munchNote;
  // to speed up file checking we pregenerate existing files now.
  await FileHelper.generateCurrentFiles(uploadDirectory);
  await DDBCompendiumFolders.generateCompendiumFolders("spells", resolvedNotifier);

  if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
  }

  resolvedNotifier("Downloading spell data..");

  // disable source filter if ids provided
  const sourceFilter = !(ids !== null && ids.length > 0);
  const results = [];
  const spellListFactory = new SpellListFactory();

  for (const className of SpellListFactory.CLASS_NAMES) {
    const spellData = await getSpellData({
      className,
      sourceFilter,
      notifier: resolvedNotifier,
    });
    spellListFactory.extractSpellListData(className, spellData);
    results.push(...spellData);
  }

  resolvedNotifier("Parsing spell data.");

  const excludeLegacy = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-exclude-legacy");

  const filteredResults = results
    .filter((r) => !excludeLegacy || (excludeLegacy && !r.definition.isLegacy))
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
  resolvedNotifier(`Importing ${finalCount} spells...`, true);
  logger.time("Spell Import Time");
  const updateResults = await itemHandler.updateCompendium(updateBool);
  const updatePromiseResults = await Promise.all(updateResults);

  logger.debug({ finalSpells: itemHandler.documents, updateResults, updatePromiseResults });
  resolvedNotifier("");
  logger.timeEnd("Spell Import Time");

  await DDBCompendiumFolders.cleanupCompendiumFolders("spells", resolvedNotifier);

  logger.debug("Starting Spell List Generation");
  resolvedNotifier(`Generating Spell List Journals...`, true);
  await spellListFactory.buildSpellLists();
  await spellListFactory.registerSpellLists();
  logger.debug("Spell List Generation Complete");

  return updateResults;
}


