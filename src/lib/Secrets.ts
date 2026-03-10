import { logger, DDBProxy, PatreonHelper, utils } from "./_module";
import { SETTINGS } from "../config/_module";

function isJSON(str: string): boolean {
  try {
    return (JSON.parse(str) && !!str && str !== null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

export function isLocalCobalt(keyPostfix: string | null): boolean {
  return keyPostfix && keyPostfix !== "" && localStorage.getItem(`ddb-cobalt-cookie-${keyPostfix}`) !== null;
}

export function getCobalt(keyPostfix = ""): string {
  let cobalt: string;
  const localCookie = utils.getSetting<boolean>("cobalt-cookie-local");
  const characterCookie = isLocalCobalt(keyPostfix);

  logger.debug(`Getting Cookie: Key postfix? "${keyPostfix}" -  Local? ${localCookie} - Character? ${characterCookie}`);
  if (characterCookie) {
    cobalt = localStorage.getItem(`ddb-cobalt-cookie-${keyPostfix}`);
  } else if (localCookie) {
    cobalt = localStorage.getItem("ddb-cobalt-cookie");
  } else {
    cobalt = utils.getSetting<string>("cobalt-cookie");
  }

  return cobalt;
}

export async function setCobalt(value: string, keyPostfix = "") {
  const localCookie = utils.getSetting<boolean>("cobalt-cookie-local");
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

export function deleteLocalCobalt(keyPostfix: string | null) {
  const localCookie = isLocalCobalt(keyPostfix);

  if (localCookie) {
    localStorage.removeItem(`ddb-cobalt-cookie-${keyPostfix}`);
  }
}

export async function moveCobaltToLocal() {
  localStorage.setItem("ddb-cobalt-cookie", utils.getSetting<string>("cobalt-cookie"));
  await game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie", "");
  game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", true);
}

export async function moveCobaltToSettings() {
  game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie", localStorage.getItem("ddb-cobalt-cookie"));
  game.settings.set(SETTINGS.MODULE_ID, "cobalt-cookie-local", false);
}

export async function checkCobalt(keyPostfix = "", alternativeKey = null) : Promise<{ success: boolean; message: string }> {
  const cobaltCookie = alternativeKey
    ? isJSON(alternativeKey)
      ? JSON.parse(alternativeKey).cbt
      : alternativeKey
    : getCobalt(keyPostfix);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, betaKey: betaKey };

  const result = await fetch(`${parsingApi}/proxy/auth`, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  try {
    const data = await result.json();
    logger.debug("Cobalt cookie check result:", data);
    return data;
  } catch (error) {
    logger.error(`Cobalt cookie check error`);
    logger.error(error);
    logger.error(error.stack);
    throw error;
  }
}

interface IDDBUserDataResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    userId: number;
    userDisplayName: string;
    twitchUserName: string;
    AvatarUrl: string;
    firstName: string;
    lastName: string | null;
    subscriptionPaidThruDate: number;
    subscriptionPlan: string;
    subscriptionTierName: string;
    subscriptionProvider: string;
    subscriptionStatus: string;
    isLegendaryBundleBuyer: boolean;
    isSourcebookBundleBuyer: boolean;
    isAdventureBundleBuyer: boolean;
    isAdventureLeagueBundleBuyer: boolean;
    isMapBundleBuyer: boolean;
  };
}

export async function getUserData(keyPostfix = "", alternativeKey = null): Promise<IDDBUserDataResponse> {
  const cobaltCookie = alternativeKey
    ? isJSON(alternativeKey)
      ? JSON.parse(alternativeKey).cbt
      : alternativeKey
    : getCobalt(keyPostfix);
  const parsingApi = DDBProxy.getProxy();
  const betaKey = PatreonHelper.getPatreonKey();
  const body = { cobalt: cobaltCookie, betaKey: betaKey };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/user-data`, {
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
