// Main module class
import { getClasses } from "./classes/classes.js";
import { munchNote, getCampaignId, download } from "./utils.js";
import { getSubClasses } from "./classes/subclasses.js";

function getSubClassesData(className) {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, className: className };
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/subclass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          download(JSON.stringify(data), `subclass-${className}-raw.json`, "application/json");
        }
        if (!data.success) {
          munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => getSubClasses(data.data))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

function getClassesData() {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          download(JSON.stringify(data), `classes-raw.json`, "application/json");
        }
        if (!data.success) {
          munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => getClasses(data.data))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

export async function parseClasses() {
  const classesResults = await getClassesData();

  const subClassResults = await Promise.allSettled([
    getSubClassesData("Cleric"),
    getSubClassesData("Druid"),
    getSubClassesData("Sorcerer"),
    getSubClassesData("Warlock"),
    getSubClassesData("Wizard"),
    getSubClassesData("Paladin"),
    getSubClassesData("Ranger"),
    getSubClassesData("Bard"),
    getSubClassesData("Barbarian"),
    getSubClassesData("Fighter"),
    getSubClassesData("Artificer"),
    getSubClassesData("Rogue"),
    getSubClassesData("Monk"),
  ]);

  return classesResults.concat(subClassResults);
}


