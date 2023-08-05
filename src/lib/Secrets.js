import logger from "../logger.js";
import SETTINGS from "../settings.js";
import DDBProxy from "./DDBProxy.js";
import PatreonHelper from "./PatreonHelper.js";

function isJSON(str) {
  try {
    return (JSON.parse(str) && !!str && str !== null);
  } catch (e) {
    return false;
  }
}

export function isLocalCobalt(keyPostfix) {
  return keyPostfix && keyPostfix !== "" && localStorage.getItem(`ddb-cobalt-cookie-${keyPostfix}`) !== null;
}

export function getCobalt(keyPostfix = "") {
  let cobalt;
  const localCookie = game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");
  const characterCookie = isLocalCobalt(keyPostfix);

  logger.debug(`Getting Cookie: Key postfix? "${keyPostfix}" -  Local? ${localCookie} - Character? ${characterCookie}`);
  if (characterCookie) {
    cobalt = localStorage.getItem(`ddb-cobalt-cookie-${keyPostfix}`);
  } else if (localCookie) {
    cobalt = localStorage.getItem("ddb-cobalt-cookie");
  } else {
    cobalt = game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie");
  }

  return cobalt;
}

export async function setCobalt(value, keyPostfix = "") {
  const localCookie = game.settings.get(SETTINGS.MODULE_ID, "cobalt-cookie-local");
  const characterCookie = keyPostfix && keyPostfix !== "";

  let cobaltValue = value;
  if (isJSON(value)) {
    cobaltValue = JSON.parse(value).cbt;
  }

  logger.debug(`Setting Cookie: Key postfix? "${keyPostfix}" -  Local? ${localCookie} - Character? ${characterCookie}`);
  if (characterCookie) {
    localStorage.setItem(`ddb-cobalt-cookie-${keyPostfix}`, cobaltValue);
  } else if (localCookie) {
    localStorage.setItem("ddb-cobalt-cookie", cobaltValue);
  } else {
    await game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie", cobaltValue);
  }
}

export function deleteLocalCobalt(keyPostfix) {
  const localCookie = isLocalCobalt(keyPostfix);

  if (localCookie) {
    localStorage.removeItem(`ddb-cobalt-cookie-${keyPostfix}`);
  }
}

export async function moveCobaltToLocal() {
  localStorage.setItem('ddb-cobalt-cookie', game.settings.get("ddb-importer", "cobalt-cookie"));
  await game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie", "");
  game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", true);
}

export async function moveCobaltToSettings() {
  game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie", localStorage.getItem('ddb-cobalt-cookie'));
  game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", false);
}

export async function checkCobalt(keyPostfix = "", alternativeKey = null) {
  const cobaltCookie = alternativeKey
    ? isJSON(alternativeKey)
      ? JSON.parse(alternativeKey).cbt
      : alternativeKey
    : getCobalt(keyPostfix);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, betaKey: betaKey };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/auth`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => resolve(data))
      .catch((error) => {
        logger.error(`Cobalt cookie check error`);
        logger.error(error);
        logger.error(error.stack);
        reject(error);
      });
  });
}
