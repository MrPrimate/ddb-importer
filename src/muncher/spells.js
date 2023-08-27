// Main module class
import { updateCompendium, srdFiddling, daeFiddling, preFetchDDBIconImages } from "./import.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import { getSpells } from "../parser/spells/getGenericSpells.js";
import FileHelper from "../lib/FileHelper.js";
import logger from "../logger.js";
import { getCobalt } from "../lib/Secrets.js";
import { getCampaignId } from "../lib/DDBCampaigns.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";
import { applyChrisPremadeEffects } from "../effects/chrisPremades.js";
import { addVision5eStubs } from "../effects/vision5e.js";
import PatreonHelper from "../lib/PatreonHelper.js";

function getSpellData(className, sourceFilter) {
  const cobaltCookie = getCobalt();
  const campaignId = getCampaignId();
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, className: className };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");
  const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
  const sources = enableSources
    ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-sources").flat()
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
          DDBMuncher.munchNote(`Failure: ${data.message}`);
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

export async function parseSpells(ids = null) {
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  await FileHelper.generateCurrentFiles(uploadDirectory);
  await DDBMuncher.generateCompendiumFolders("spells");

  DDBMuncher.munchNote("Downloading spell data..");

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

  DDBMuncher.munchNote("Parsing spell data..");

  const filteredResults = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value).flat().flat();

  const rawSpells = await getSpells(filteredResults);

  const spells = rawSpells
    .filter((spell) => spell?.name)
    .map((spell) => {
      spell.name = spell.name.replace(/’/g, "'");
      return spell;
    });

  if (results.some((r) => r.status === "rejected")) {
    DDBMuncher.munchNote("Failed to parse some spells, see the developer console (F12) for details.");
    logger.error("Failed spell parsing", results);
  }

  await preFetchDDBIconImages();

  let uniqueSpells = spells.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
  const srdSpells = await srdFiddling(uniqueSpells, "spells");
  const filteredSpells = (ids !== null && ids.length > 0)
    ? srdSpells.filter((s) => s.flags?.ddbimporter?.definitionId && ids.includes(String(s.flags.ddbimporter.definitionId)))
    : srdSpells;
  const daeSpells = await daeFiddling(filteredSpells);
  const visionSpells = addVision5eStubs(daeSpells);
  const finalSpells = await applyChrisPremadeEffects({ documents: visionSpells, compendiumItem: true });

  const finalCount = finalSpells.length;
  DDBMuncher.munchNote(`Importing ${finalCount} spells...`, true);

  const updateResults = await updateCompendium("spells", { inventory: finalSpells }, updateBool);
  const updatePromiseResults = await Promise.all(updateResults);

  logger.debug({ finalSpells, updateResults, updatePromiseResults });
  DDBMuncher.munchNote("");
  return updateResults;
}


