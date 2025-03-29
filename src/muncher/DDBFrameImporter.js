// Main module class
import {
  logger,
  Secrets,
  FileHelper,
  PatreonHelper,
  DDBProxy,
  utils,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";

export default class DDBFrameImporter {

  static async getFrameData() {
    const cobaltCookie = Secrets.getCobalt();
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
            utils.munchNote(`API Failure: ${data.message}`);
            reject(data.message);
          }
          if (debugJson) {
            FileHelper.download(JSON.stringify(data), `frames-raw.json`, "application/json");
          }
          return data;
        })
        .then((data) => {
          utils.munchNote(`Retrieved ${data.data.length} frames, starting parse...`, { nameField: true });
          logger.info(`Retrieved ${data.data.length} frames`);
          resolve(data.data);
        })
        .catch((error) => reject(error));
    });
  }

  static async parseFrames() {
    const frames = await DDBFrameImporter.getFrameData();
    logger.debug("Importing frames", frames);
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "frame-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
    const imageNamePrefix = useDeepPaths ? "" : "frames";

    utils.munchNote(`Fetching DDB Frames`);
    frames.forEach(async (frame) => {
      const options = { type: "frame", name: `DDB ${frame.name}`, download: true, targetDirectory, pathPostfix: "", imageNamePrefix };
      await FileHelper.getImagePath(frame.frameAvatarUrl, options);
    });

    utils.munchNote("");

    return frames.length;
  }

}
