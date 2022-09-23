// Main module class
import { updateCompendium, srdFiddling, daeFiddling } from "./import.js";
import { munchNote, getCampaignId, download } from "./utils.js";
import { getSpells } from "../parser/spells/getGenericSpells.js";
import FileHelper from "../utils/files.js";
import logger from "../logger.js";
import { getCobalt } from "../lib/Secrets.js";
import { createCompendiumFolderStructure } from "./compendiumFolders.js";

function getSpellData(className, sourceFilter) {
  const cobaltCookie = getCobalt();
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, className: className };
  const debugJson = game.settings.get("ddb-importer", "debug-json");
  const enableSources = game.settings.get("ddb-importer", "munching-policy-use-source-filter");
  const sources = enableSources
    ? game.settings.get("ddb-importer", "munching-policy-muncher-sources").flat()
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
          download(JSON.stringify(data), `spells-raw.json`, "application/json");
        }
        if (!data.success) {
          munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => {
        if (sources.length == 0 || !sourceFilter) return data.data;
        return data.data.filter((spell) =>
          spell.definition.sources.some((source) => sources.includes(source.sourceId))
        );
      })
      .then((data) => resolve(data))
      .catch((error) => {
        logger.warn(error);
        reject(error);
      });
  });
}

export async function parseSpells(ids = null) {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const uploadDirectory = game.settings.get("ddb-importer", "other-image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  await FileHelper.generateCurrentFiles(uploadDirectory);

  const addToCompendiumFolder = game.settings.get("ddb-importer", "munching-policy-use-compendium-folders");
  const compendiumFoldersInstalled = game.modules.get("compendium-folders")?.active;
  if (addToCompendiumFolder && compendiumFoldersInstalled) {
    munchNote(`Checking compendium folders..`, true);
    await createCompendiumFolderStructure("spells");
    munchNote("", true);
  }

  munchNote("Downloading spell data..");

  // disable source filter if ids provided
  const sourceFilter = !(ids !== null && ids.length > 0);
  const results = await Promise.allSettled([
    getSpellData("Cleric", sourceFilter),
    getSpellData("Druid", sourceFilter),
    getSpellData("Sorcerer", sourceFilter),
    getSpellData("Warlock", sourceFilter),
    getSpellData("Wizard", sourceFilter),
    getSpellData("Paladin", sourceFilter),
    getSpellData("Ranger", sourceFilter),
    getSpellData("Bard", sourceFilter),
    getSpellData("Graviturgy", sourceFilter),
    getSpellData("Chronurgy", sourceFilter),
    getSpellData("Artificer", sourceFilter),
  ]);

  munchNote("Parsing spell data..");

  const filteredResults = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value).flat().flat();

  const rawSpells = getSpells(filteredResults);

  const spells = rawSpells
    .filter((spell) => spell?.name)
    .map((spell) => {
      spell.name = spell.name.replace(/’/g, "'");
      return spell;
    });

  if (results.some((r) => r.status === "rejected")) {
    munchNote("Failed to parse some spells, see the developer console (F12) for details.");
    logger.error("Failed spell parsing", results);
  }

  let uniqueSpells = spells.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
  const srdSpells = await srdFiddling(uniqueSpells, "spells");
  const filteredSpells = (ids !== null && ids.length > 0)
    ? srdSpells.filter((s) => s.flags?.ddbimporter?.definitionId && ids.includes(String(s.flags.ddbimporter.definitionId)))
    : srdSpells;
  const finalSpells = await daeFiddling(filteredSpells);

  const finalCount = finalSpells.length;
  munchNote(`Importing ${finalCount} spells...`, true);

  return new Promise((resolve) => {
    resolve(updateCompendium("spells", { spells: finalSpells }, updateBool));
  });
}


