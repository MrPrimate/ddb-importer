// Main module class
import { getImagePath } from "./import.js";
import { munchNote, download } from "./utils.js";
import logger from "../logger.js";
import { getCobalt } from "../lib/Secrets.js";

async function getFrameData() {
  const cobaltCookie = getCobalt();
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  const body = {
    cobalt: cobaltCookie,
    betaKey: betaKey,
  };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/frames`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          munchNote(`API Failure: ${data.message}`);
          reject(data.message);
        }
        if (debugJson) {
          download(JSON.stringify(data), `frames-raw.json`, "application/json");
        }
        return data;
      })
      .then((data) => {
        munchNote(`Retrieved ${data.data.length} frames, starting parse...`, true, false);
        logger.info(`Retrieved ${data.data.length} frames`);
        resolve(data.data);
      })
      .catch((error) => reject(error));
  });
}

export async function parseFrames() {
  const frames = await getFrameData();
  logger.debug("Importing frames", frames);

  munchNote(`Fetching DDB Frames`);
  frames.forEach(async (frame) => {
    await getImagePath(frame.frameAvatarUrl, 'frame', `DDB ${frame.name}`, true);
  });

  munchNote("");

  return frames.length;
}
