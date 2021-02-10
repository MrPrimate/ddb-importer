// Main module class
import { updateCompendium, srdFiddling, daeFiddling } from "./import.js";
import { munchNote, getCampaignId, download } from "./utils.js";
import { getSpells } from "../parser/spells/getGenericSpells.js";
import utils from "../utils.js";

function getSpellData(className) {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, className: className };
  const debugJson = game.settings.get("ddb-importer", "debug-json");
  const sources = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat();

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
        if (sources.length == 0) return data.data;
        return data.data.filter((spell) =>
          spell.definition.sources.some((source) => sources.includes(source.sourceId))
        );
      })
      .then((data) => getSpells(data))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
    });
}

export async function parseSpells() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  await utils.generateCurrentFiles(uploadDirectory);

  const results = await Promise.allSettled([
    getSpellData("Cleric"),
    getSpellData("Druid"),
    getSpellData("Sorcerer"),
    getSpellData("Warlock"),
    getSpellData("Wizard"),
    getSpellData("Paladin"),
    getSpellData("Ranger"),
    getSpellData("Bard"),
    getSpellData("Graviturgy"),
    getSpellData("Chronurgy"),
  ]);

  const spells = results.map((r) => r.value).flat().flat()
  .map((spell) => {
    spell.name = spell.name.replace(/’/g, "'");
    return spell;
  });
  let uniqueSpells = spells.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
  const srdSpells = await srdFiddling(uniqueSpells, "spells");
  const finalSpells = await daeFiddling(srdSpells);

  const finalCount = finalSpells.length;
  munchNote(`Importing ${finalCount} spells...`, true);

  return new Promise((resolve) => {
    resolve(updateCompendium("spells", { spells: finalSpells }, updateBool));
  });
}


