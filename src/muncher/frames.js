// Main module class
import DDBMuncher from "../apps/DDBMuncher.js";
import logger from "../logger.js";
import { getCobalt } from "../lib/Secrets.js";
import FileHelper from "../lib/FileHelper.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";
import PatreonHelper from "../lib/PatreonHelper.js";

async function getFrameData() {
  const cobaltCookie = getCobalt();
  const betaKey = PatreonHelper.getPatreonKey();
  const parsingApi = DDBProxy.getProxy();
  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

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
          DDBMuncher.munchNote(`API Failure: ${data.message}`);
          reject(data.message);
        }
        if (debugJson) {
          FileHelper.download(JSON.stringify(data), `frames-raw.json`, "application/json");
        }
        return data;
      })
      .then((data) => {
        DDBMuncher.munchNote(`Retrieved ${data.data.length} frames, starting parse...`, true, false);
        logger.info(`Retrieved ${data.data.length} frames`);
        resolve(data.data);
      })
      .catch((error) => reject(error));
  });
}

export async function parseFrames() {
  const frames = await getFrameData();
  logger.debug("Importing frames", frames);
  const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "frame-image-upload-directory").replace(/^\/|\/$/g, "");
  const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
  const imageNamePrefix = useDeepPaths ? "" : "frames";

  DDBMuncher.munchNote(`Fetching DDB Frames`);
  frames.forEach(async (frame) => {
    const options = { type: "frame", name: `DDB ${frame.name}`, download: true, targetDirectory, pathPostfix: "", imageNamePrefix };
    await FileHelper.getImagePath(frame.frameAvatarUrl, options);
  });

  DDBMuncher.munchNote("");

  return frames.length;
}
