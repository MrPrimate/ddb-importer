import logger from "../logger.js";
import {
  download,
} from "../muncher/utils.js";

export async function getCharacterOptions(ddb) {

  if (ddb.preferences.enableOptionalClassFeatures) {
    const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
    const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
    const campaignId = (ddb.campaign && ddb.campaign.id && ddb.campaign.id !== "") ? ddb.campaign.id : null;
    const betaKey = game.settings.get("ddb-importer", "beta-key");
    const optionIds = ddb.optionalClassFeatures.map((opt) => opt.classFeatureId);
    const body = { cobalt: cobaltCookie, betaKey: betaKey, ids: optionIds, campaignId: campaignId };

    return new Promise((resolve) => {
      fetch(`${parsingApi}/proxy/character/options`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        referrerPolicy: "no-referrer",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.success) {
             return [];
          }
          const debugJson = game.settings.get("ddb-importer", "debug-json");
          if (debugJson) {
            download(JSON.stringify(data), `${ddb.id}-options-raw.json`, "application/json");
          }
          return data.data;
        })
        .then((data) => resolve(data))
        .catch((error) => {
          logger.error("Options JSON Fetch and Parse Error");
          logger.error(error);
          logger.error(error.stack);
          resolve([]);
        });
    });
  } else {
    return [];
  }

}
