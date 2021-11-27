// Main module class
import { updateCompendium, srdFiddling, daeFiddling } from "./import.js";
import { munchNote, getCampaignId, download } from "./utils.js";
import getInventory from "../parser/inventory/index.js";
import utils from "../utils.js";
import { getCobalt } from "../lib/Secrets.js";
import logger from "../logger.js";
import { createCompendiumFolderStructure } from "./compendiumFolders.js";

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
    data: JSON.parse(utils.getTemplate("character")),
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
  const inventory = getInventory(mockDDB, mockCharacter, itemSpells);
  const results = {
    items: inventory,
    itemSpellNames: itemSpells, // this needs to be a list of spells to find
  };
  return results;
}

function getItemData(sourceFilter) {
  const cobaltCookie = getCobalt();
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get("ddb-importer", "debug-json");
  const sources = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat();

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
          download(JSON.stringify(data), `items-raw.json`, "application/json");
        }
        if (!data.success) {
          munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => {
        if (sources.length == 0 || !sourceFilter) return data.data;
        return data.data.filter((item) =>
          item.sources.some((source) => sources.includes(source.sourceId))
        );
      })
      .then((data) => getCharacterInventory(data))
      .then((items) => generateImportItems(items))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

export async function addMagicItemSpells(items, spells, updateBool) {
  if (spells.length === 0) return;
  const itemSpells = await updateCompendium("itemspells", { itemspells: spells }, updateBool);
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

export async function parseItems(ids = null) {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const magicItemsInstalled = !!game.modules.get("magicitems");
  const uploadDirectory = game.settings.get("ddb-importer", "other-image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  logger.info("Checking for existing files...");
  await utils.generateCurrentFiles(uploadDirectory);
  logger.info("Check complete, getting ItemData.");

  const addToCompendiumFolder = game.settings.get("ddb-importer", "munching-policy-use-compendium-folders");
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");
  if (addToCompendiumFolder && compendiumFoldersInstalled) {
    munchNote(`Checking compendium folders..`, true);
    await createCompendiumFolderStructure("items");
  }

  munchNote("Downloading item data..");

  // disable source filter if ids provided
  const sourceFilter = !(ids !== null && ids.length > 0);
  const results = await getItemData(sourceFilter);
  let items = results.items;

  munchNote("Parsing item data..");

  // Items Spell addition is currently not done, parsing out spells needs to be addded
  // let itemSpells = results.value.itemSpells;
  let itemSpells = null;

  // store all spells in the folder specific for Dynamic Items
  if (magicItemsInstalled && itemSpells && Array.isArray(itemSpells)) {
    await addMagicItemSpells(items, itemSpells, updateBool);
  }

  const srdItems = await srdFiddling(items, "inventory");
  const filteredItems = (ids !== null && ids.length > 0)
    ? srdItems.filter((s) => s.flags?.ddbimporter?.definitionId && ids.includes(String(s.flags.ddbimporter.definitionId)))
    : srdItems;
  const finalItems = await daeFiddling(filteredItems);

  const finalCount = finalItems.length;
  munchNote(`Importing ${finalCount} items!`, true);

  return new Promise((resolve) => {
    resolve(updateCompendium("inventory", { inventory: finalItems }, updateBool));
  });
}


