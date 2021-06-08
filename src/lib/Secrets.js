import logger from "../logger.js";

function isJSON(str) {
  try {
      return (JSON.parse(str) && !!str && str !== null);
  } catch (e) {
      return false;
  }
}

export function getCobalt() {
  let cobalt;
  const localCookie = game.settings.get("ddb-importer", "cobalt-cookie-local");

  if (localCookie) {
    cobalt = localStorage.getItem('ddb-cobalt-cookie');
  } else {
    cobalt = game.settings.get("ddb-importer", "cobalt-cookie");
  }

  return cobalt;
}

export async function setCobalt(value) {
  const localCookie = game.settings.get("ddb-importer", "cobalt-cookie-local");

  let cobaltValue = value;
  if (isJSON(value)) {
    cobaltValue = JSON.parse(value).cbt;
  }

  if (localCookie) {
    localStorage.setItem('ddb-cobalt-cookie', cobaltValue);
  } else {
    await game.settings.set("ddb-importer", "cobalt-cookie", cobaltValue);
  }

}

export async function moveCobaltToLocal() {
  localStorage.setItem('ddb-cobalt-cookie', game.settings.get("ddb-importer", "cobalt-cookie"));
  await game.settings.set("ddb-importer", "cobalt-cookie", "");
  game.settings.set("ddb-importer", "cobalt-cookie-local", true);
}

export async function moveCobaltToSettings() {
  game.settings.set("ddb-importer", "cobalt-cookie", localStorage.getItem('ddb-cobalt-cookie'));
  game.settings.set("ddb-importer", "cobalt-cookie-local", false);
}

export async function checkCobalt() {
  const cobaltCookie = getCobalt();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, betaKey: betaKey };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/auth`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
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
