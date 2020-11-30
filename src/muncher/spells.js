// Main module class
import { updateCompendium, srdFiddling, munchNote, getCampaignId, download } from "./import.js";
import { getSpells } from "../parser/spells/getGenericSpells.js";

function getSpellData(className) {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie, campaignId: campaignId };
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/getClassSpells/${className}`, {
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
      .then((data) => getSpells(data.data))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
    });
}

export async function parseSpells() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  const results = await Promise.allSettled([
    getSpellData("Cleric"),
    getSpellData("Druid"),
    getSpellData("Sorcerer"),
    getSpellData("Warlock"),
    getSpellData("Wizard"),
    getSpellData("Paladin"),
    getSpellData("Ranger"),
    getSpellData("Bard"),
  ]);

  const spells = results.map((r) => r.value).flat().flat().map((spell) => {
    spell.name = spell.name.replace(/’/g, "'");
    return spell;
  });
  let uniqueSpells = spells.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
  const finalSpells = await srdFiddling(uniqueSpells, "spells");

  const finalCount = finalSpells.length;
  munchNote(`Importing ${finalCount} spells...`, true);

  return new Promise((resolve) => {
    resolve(updateCompendium("spells", { spells: finalSpells }, updateBool));
  });
}


