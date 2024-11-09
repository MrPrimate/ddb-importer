// Main module class
import { getClasses } from "./classes/classes.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import { getSubClasses } from "./classes/subclasses.js";
import { getClassOptions } from "./classes/options.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBCampaigns from "../lib/DDBCampaigns.js";
import FileHelper from "../lib/FileHelper.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import { utils } from "../lib/_module.mjs";
import { createDDBCompendium } from "../hooks/ready/checkCompendiums.js";

function getSubClassesData(className) {
  const cobaltCookie = getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(DDBMuncher.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, className: className };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

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
          FileHelper.download(JSON.stringify(data), `subclass-${className}-raw.json`, "application/json");
        }
        if (!data.success) {
          DDBMuncher.munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => reject(error));
  });
}

function getClassOptionsData(className) {
  const cobaltCookie = getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(DDBMuncher.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey, className: className };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

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
          FileHelper.download(JSON.stringify(data), `subclass-${className}-raw.json`, "application/json");
        }
        if (!data.success) {
          DDBMuncher.munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => reject(error));
  });
}

function getClassesData() {
  const cobaltCookie = getCobalt();
  const campaignId = DDBCampaigns.getCampaignId(DDBMuncher.munchNote);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

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
          FileHelper.download(JSON.stringify(data), `classes-raw.json`, "application/json");
        }
        if (!data.success) {
          DDBMuncher.munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => reject(error));
  });
}

export async function parseClasses() {

  const classesCompData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Classes");
  await createDDBCompendium(classesCompData);

  const subClassCompData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Subclasses");
  await createDDBCompendium(subClassCompData);

  const classFeaturesCompData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Class Features");
  await createDDBCompendium(classFeaturesCompData);

  const classData = await getClassesData();
  const classesResults = await getClasses(classData);

  const classNames = CONFIG.DDB.classConfigurations
    .filter((c) => !c.name.includes("archived") && !c.name.includes("(UA)"))
    .map((c) => c.name);

  const subClassResults = [];
  for (const className of classNames) {
    const klass = classData.find((c) => c.name === className);
    const subClassData = await getSubClassesData(className);
    if (!klass || (subClassData && utils.isArray(subClassData) && subClassData.length > 0)) {
      const subClassResult = await getSubClasses(subClassData, klass);
      subClassResults.push(...subClassResult);
    }
  }

  const classOptionsResults = [];
  for (const className of classNames) {
    const classOptionsData = await getClassOptionsData(className);
    const classOptionsResult = await getClassOptions(classOptionsData, className);
    classOptionsResults.push(...classOptionsResult);
  }

  const results = classesResults.concat(
    subClassResults.flat(),
    classOptionsResults.flat(),
    // [],
  );

  // FileHelper.download(JSON.stringify(results), `classes-icon.json`, "application/json");
  return results;
}


