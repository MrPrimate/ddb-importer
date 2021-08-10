// Main module class
import { getClasses } from "./classes/classes.js";
import { munchNote, getCampaignId, download } from "./utils.js";
import { getSubClasses } from "./classes/subclasses.js";
import { getClassOptions } from "./classes/options.js";
import { getCobalt } from "../lib/Secrets.js";

function getSubClassesData(className) {
  const cobaltCookie = getCobalt();
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

function getClassOptionsData(className) {
  const cobaltCookie = getCobalt();
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, className: className };
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/v5/classes/options`, {
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
      .then((data) => getClassOptions(data.data, className))
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

function getClassesData() {
  const cobaltCookie = getCobalt();
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

  const subClassResults = await Promise.all([
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
    getSubClassesData("Blood Hunter"),
  ]);

  const classOptionsResults = await Promise.all([
    getClassOptionsData("Cleric"),
    getClassOptionsData("Druid"),
    getClassOptionsData("Sorcerer"),
    getClassOptionsData("Warlock"),
    getClassOptionsData("Wizard"),
    getClassOptionsData("Paladin"),
    getClassOptionsData("Ranger"),
    getClassOptionsData("Bard"),
    getClassOptionsData("Barbarian"),
    getClassOptionsData("Fighter"),
    getClassOptionsData("Rogue"),
    getClassOptionsData("Monk"),
    getClassOptionsData("Blood Hunter"),
    getClassOptionsData("Artificer"),
  ]);

  const results = classesResults.concat(subClassResults.flat(), classOptionsResults.flat());

  // download(JSON.stringify(results), `classes-icon.json`, "application/json");

  return results;
}


