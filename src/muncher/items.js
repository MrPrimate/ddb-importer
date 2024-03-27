// Main module class
import DDBMuncher from "../apps/DDBMuncher.js";
import utils from "../lib/utils.js";
import FileHelper from "../lib/FileHelper.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBCampaigns from "../lib/DDBCampaigns.js";
import logger from "../logger.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import DDBCharacter from "../parser/DDBCharacter.js";
import { addVision5eStubs } from "../effects/vision5e.js";
import DDBMacros from "../effects/DDBMacros.js";
import Iconizer from "../lib/Iconizer.js";
import DDBItemImporter from "../lib/DDBItemImporter.js";
import ExternalAutomations from "../effects/external/ExternalAutomations.js";

async function getCharacterInventory(items) {
  return items.map((item) => {
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
    };
  });
}

async function generateImportItems(items) {
  const mockCharacter = {
    system: utils.getTemplate("character"),
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
      modifiers: {
        race: [],
        class: [],
        background: [],
        feat: [],
        item: [],
        condition: [],
      },
      feats: [],
    }
  };
  let itemSpells = []; // here we need to parse each available spell and build a mock spell parser
  const ddbCharacter = new DDBCharacter(mockDDB);
  ddbCharacter.raw.character = mockCharacter;
  ddbCharacter.source = {
    ddb: mockDDB
  };
  ddbCharacter.raw.itemSpells = [];
  const inventory = await ddbCharacter.getInventory();
  const results = {
    items: inventory,
    itemSpellNames: itemSpells, // this needs to be a list of spells to find
  };
  return results;
}

function getItemData(sourceFilter) {
  const cobaltCookie = getCobalt();
  const campaignId = DDBCampaigns.getCampaignId();
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");
  const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
  const useGenerics = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-generic-items");
  const sources = enableSources
    ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-sources").flat()
    : [];

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
          DDBMuncher.munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => {
        const genericsFilteredData = data.data.filter((item) => item.canBeAddedToInventory || useGenerics);
        if (sources.length == 0 || !sourceFilter) return genericsFilteredData;
        return genericsFilteredData.filter((item) =>
          item.sources.some((source) => sources.includes(source.sourceId))
        );
      })
      .then((data) => {
        if (sources.length > 0) return data;
        if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew-only")) {
          return data.filter((item) => item.isHomebrew);
        } else if (!game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew")) {
          return data.filter((item) => !item.isHomebrew);
        } else {
          return data;
        }
      })
      .then((data) => getCharacterInventory(data))
      .then((items) => generateImportItems(items))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

async function addMagicItemSpells(items, spells, updateBool) {
  if (spells.length === 0) return;
  const itemHandler = new DDBItemImporter("itemspells", spells);
  await itemHandler.init();
  const itemSpells = await itemHandler.updateCompendium(updateBool);
  // scan the inventory for each item with spells and copy the imported data over
  items.forEach((item) => {
    if (item.flags.magicitems.spells) {
      for (let [i, spell] of Object.entries(item.flags.magicitems.spells)) {
        const itemSpell = itemSpells.find((item) => item.name === spell.name);
        if (itemSpell) {
          for (const [key, value] of Object.entries(itemSpell)) {
            item.flags.magicitems.spells[i][key] = value;
          }
        }
      }
    }
  });
}

export async function parseItems(ids = null, deleteBeforeUpdate = null) {
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const magicItemsInstalled = !!game.modules.get("magicitems");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  logger.info("Checking for existing files...");
  await FileHelper.generateCurrentFiles(uploadDirectory);
  logger.info("Check complete, getting ItemData.");

  await DDBMuncher.generateCompendiumFolders("items");

  if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
  }

  DDBMuncher.munchNote("Downloading item data..");

  // disable source filter if ids provided
  const sourceFilter = !(ids !== null && ids.length > 0);
  const results = await getItemData(sourceFilter);
  let items = results.items;

  DDBMuncher.munchNote("Parsing item data..");

  // Items Spell addition is currently not done, parsing out spells needs to be addded
  // let itemSpells = results.value.itemSpells;
  let itemSpells = null;

  // store all spells in the folder specific for Dynamic Items
  if (magicItemsInstalled && itemSpells && Array.isArray(itemSpells)) {
    await addMagicItemSpells(items, itemSpells, updateBool);
  }

  await Iconizer.preFetchDDBIconImages();

  const itemHandler = new DDBItemImporter("items", items, { deleteBeforeUpdate });
  await itemHandler.init();
  await itemHandler.srdFiddling();
  await itemHandler.iconAdditions();
  const filteredItems = (ids !== null && ids.length > 0)
    ? itemHandler.documents.filter((s) => s.flags?.ddbimporter?.definitionId && ids.includes(String(s.flags.ddbimporter.definitionId)))
    : itemHandler.documents;
  const vision5eItems = addVision5eStubs(filteredItems);
  itemHandler.documents = await ExternalAutomations.applyChrisPremadeEffects({ documents: vision5eItems, compendiumItem: true });

  const finalCount = itemHandler.documents.length;
  DDBMuncher.munchNote(`Importing ${finalCount} items!`, true);
  logger.time("Item Import Time");

  const updateResults = await itemHandler.updateCompendium(updateBool);
  const updatePromiseResults = await Promise.all(updateResults);

  logger.debug({ finalItems: itemHandler.documents, updateResults, updatePromiseResults });
  DDBMuncher.munchNote("");
  logger.timeEnd("Item Import Time");
  return updateResults;
}


