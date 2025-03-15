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
import DDBCharacter from "../parser/DDBCharacter.js";
import { ExternalAutomations } from "../effects/_module.mjs";
import GenericSpellFactory from "../parser/spells/GenericSpellFactory.js";
import { DDBReferenceLinker, SystemHelpers } from "../parser/lib/_module.mjs";

function getCharacterInventory(items, extra = []) {
  return items.map((item) => {
    const extraItem = extra.find((e) => e.id == item.id);
    const limitedUse = extraItem
      ? extraItem.data.limitedUse
      : null;
    return {
      chargesUsed: 0,
      definitionId: 0,
      definitionTypeId: 0,
      displayAsAttack: null,
      entityTypeId: 0,
      equipped: false,
      id: 0,
      isAttuned: false,
      quantity: item.bundleSize ? item.bundleSize : 1,
      definition: item,
      limitedUse,
    };
  });
}

async function generateImportItems(items, notifier, itemSpells = []) {
  const mockCharacter = {
    system: SystemHelpers.getTemplate("character"),
    type: "character",
    name: "",
    flags: {
      ddbimporter: {
        compendium: true,
        dndbeyond: {
          effectAbilities: [],
          totalLevels: 0,
          proficiencies: [],
          proficienciesIncludingEffects: [],
          characterValues: [],
        },
      },
    },
  };
  const mockDDB = {
    character: {
      classes: [],
      race: {
        racialTraits: [],
      },
      characterValues: [],
      inventory: items,
      customItems: null,
      options: {
        class: [],
        race: [],
        feat: [],
      },
      spells: {
        item: itemSpells,
      },
      modifiers: {
        race: [],
        class: [],
        background: [],
        feat: [],
        item: [],
        condition: [],
      },
      feats: [],
    },
  };
  const ddbCharacter = new DDBCharacter(mockDDB);
  ddbCharacter.raw.character = mockCharacter;
  ddbCharacter.source = {
    ddb: mockDDB,
  };

  const spells = await GenericSpellFactory.getItemSpells(mockDDB, ddbCharacter.raw.character, {
    generateSummons: true,
    notifier,
  });
  ddbCharacter.raw.itemSpells = spells;

  // console.warn("spells", {
  //   spells,
  //   itemSpells,
  // });

  const inventory = await ddbCharacter.getInventory(notifier);
  const results = {
    items: inventory,
    spells: ddbCharacter.raw.itemSpells, // this needs to be a list of spells to find
  };
  // console.warn(results);
  return results;
}

function getItemData({ useSourceFilter = true, ids = [] } = {}) {
  const cobaltCookie = Secrets.getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, addSpells: true };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");
  const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
  const useGenerics = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-generic-items");
  const sources = enableSources
    ? DDBSources.getSelectedSourceIds()
    : [];

  const excludeLegacy = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-exclude-legacy");

  logger.debug(`Fetching Items with:`, {
    debugJson,
    enableSources,
    useGenerics,
    sources,
    excludeLegacy,
    useSourceFilter,
  });

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          FileHelper.download(JSON.stringify(data), `items-raw.json`, "application/json");
        }
        if (!data.success) {
          utils.munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data.data;
      })
      .then((data) => {
        if (DDBProxy.isCustom()) {
          return {
            items: data,
            spells: [],
            extra: [],
          };
        } else {
          return {
            items: data.items,
            spells: data.spells.map((s) => s.data),
            extra: data.extra,
          };
        }
      })
      .then((data) => {
        // handle category filtering
        if (ids.length > 0) return data;
        const categoryItems = data.items
          .map((item) => {
            item.sources = item.sources.filter((source) =>
              DDBSources.isSourceInAllowedCategory(source),
              // && source.sourceType === 1,
            );
            return item;
          })
          .filter((item) => {
            if (item.isHomebrew) return true;
            return item.sources.length > 0;
          });
        return {
          items: categoryItems,
          spells: data.spells,
          extra: data.extra,
        };
      })
      .then((data) => {
        // handle source filtering
        const filteredItems = useGenerics ? data.items : data.items.filter((item) => item.canBeAddedToInventory);
        return {
          items: (sources.length === 0 || !useSourceFilter)
            ? filteredItems
            : filteredItems.filter((item) =>
              item.sources.some((source) => sources.includes(source.sourceId)),
            ),
          spells: data.spells,
          extra: data.extra,
        };
      })
      .then((data) => {
        // handle homebrew filtering
        if (sources.length > 0) return data;
        if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew-only")) {
          return {
            items: data.items.filter((item) => item.isHomebrew),
            spells: data.spells,
            extra: data.extra,
          };
        } else if (!game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew")) {
          return {
            items: data.items.filter((item) => !item.isHomebrew),
            spells: data.spells,
            extra: data.extra,
          };
        } else {
          return data;
        }
      })
      .then((data) => {
        if (ids.length > 0) return {
          items: data.items.filter((item) => ids.includes(item.id)),
          spells: data.spells,
          extra: data.extra,
        };
        return data;
      })
      .then((data) => {
        if (!excludeLegacy) return data;
        return {
          items: data.items.filter((r) => !r.isLegacy),
          spells: data.spells,
          extra: data.extra,
        };
      })
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}


export async function parseItems({ useSourceFilter = true, ids = [], deleteBeforeUpdate = null, notifier = null } = {}) {
  await DDBReferenceLinker.importCacheLoad();
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  // const magicItemsInstalled = !!game.modules.get("magicitems");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

  const resolvedNotifier = (notifier ?? utils.munchNote);
  // to speed up file checking we pregenerate existing files now.
  logger.info("Checking for existing files...");
  await FileHelper.generateCurrentFiles(uploadDirectory);
  logger.info("Check complete, getting ItemData.");

  if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
  }

  resolvedNotifier("Downloading item data..");

  // disable source filter if ids provided
  const sourceFilter = (ids === null || ids.length === 0) && useSourceFilter;
  const raw = await getItemData({ useSourceFilter: sourceFilter, ids });

  const characterInventory = getCharacterInventory(raw.items, raw.extra);
  const results = await generateImportItems(characterInventory, resolvedNotifier, raw.spells);

  let items = results.items;
  // console.warn("spell imports", {
  //   results,
  //   raw,
  //   characterInventory,
  // });

  resolvedNotifier("Analysing generated items...", { nameField: true });

  await Iconizer.preFetchDDBIconImages();

  const itemHandler = new DDBItemImporter("items", items, {
    deleteBeforeUpdate,
    matchFlags: ["is2014", "is2024"],
    notifier: resolvedNotifier,
  });
  await itemHandler.init();
  await itemHandler.srdFiddling();
  resolvedNotifier(`Imps are creating iconographs for ${itemHandler.documents.length} possible items (this can take a while)`, { nameField: true });
  await itemHandler.iconAdditions();
  const filteredItems = (ids !== null && ids.length > 0)
    ? itemHandler.documents.filter((s) => s.flags?.ddbimporter?.definitionId && ids.includes(String(s.flags.ddbimporter.definitionId)))
    : itemHandler.documents;
  itemHandler.documents = await ExternalAutomations.applyChrisPremadeEffects({ documents: filteredItems, compendiumItem: true });

  const finalCount = itemHandler.documents.length;
  resolvedNotifier(`Preparing to import ${finalCount} items!`, { nameField: true });
  logger.time("Item Import Time");

  await itemHandler.compendiumFolders.loadCompendium("items", true);
  await itemHandler.compendiumFolders.createItemFoldersForDocuments({ documents: itemHandler.documents });

  const updateResults = await itemHandler.updateCompendium(updateBool);
  const updatePromiseResults = await Promise.all(updateResults);

  await DDBCompendiumFolders.cleanupCompendiumFolders("items", resolvedNotifier);

  logger.debug("Final Item Import Data", { finalItems: itemHandler.documents, updateResults, updatePromiseResults });
  resolvedNotifier("");
  logger.timeEnd("Item Import Time");
  return updateResults;
}


