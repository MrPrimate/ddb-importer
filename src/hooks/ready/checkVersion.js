import utils from "../../utils.js";
import logger from "../../logger.js";

const MODULE_TITLE = "DDB Importer";
const MODULE_NAME = "ddb-importer";
const MODULE_AUTHOR = "MrPrimate";
const _GITHUB_API_LATEST = `https://api.github.com/repos/${MODULE_AUTHOR}/${MODULE_NAME}/releases/latest`;
const _GITHUB_MODULE_JSON_LATEST = `https://raw.githubusercontent.com/${MODULE_AUTHOR}/${MODULE_NAME}/master/module-template.json`;

// eslint-disable-next-line consistent-return
async function getLatestModuleVersion() {
  try {
      const { tag_name: latestVersion, prerelease } = await $.getJSON(_GITHUB_API_LATEST);
      return { latestVersion, prerelease };
  } catch (error) {
      logger.error(error);
  }
}

// eslint-disable-next-line consistent-return
async function getLatestModuleMinimumCoreVersion() {
  try {
      const { minimumCoreVersion, compatibleCoreVersion } = await $.getJSON(_GITHUB_MODULE_JSON_LATEST);
      return { minimumCoreVersion, compatibleCoreVersion };
  } catch (error) {
    logger.error(error);
  }
}

export default async () => {
  // check version number only for GMs
  const check = game.settings.get("ddb-importer", "update-check");
  if (!check || !game.user.isGM) return;

  const moduleInfo = game.modules.get(MODULE_NAME).data;
  const installedVersion = moduleInfo.version;
  try {
    const { latestVersion, prerelease: preRelease } = await getLatestModuleVersion();
    const { minimumCoreVersion, compatibleCoreVersion } = await getLatestModuleMinimumCoreVersion();

    const newModuleVersion = utils.versionCompare(latestVersion, installedVersion) === 1;
    const compatibleCore = utils.versionCompare(game.data.version, compatibleCoreVersion) >= 0;
    const compatibleMinimumCore = utils.versionCompare(game.data.version, minimumCoreVersion) >= 0;

    const needToUpdate = newModuleVersion && compatibleCore && compatibleMinimumCore;

    // console.log(utils.versionCompare("1.0.1", "1.0.1")); // 0
    // console.log(utils.versionCompare("1.0.0", "1.0.1")); // -1
    // console.log(utils.versionCompare("2.0.0", "1.0.1")); // 1

    if (preRelease) logger.debug(`Prerelease of ${MODULE_TITLE} detected`);

    if (needToUpdate) {
      let text = $(
        `<h2>${MODULE_TITLE} Update!</h2><p>A new <b>${MODULE_NAME}</b> version is available. Please update to <b>v${latestVersion}</b> if you are experiencing issues and before reporting a bug.</p>`
      );
      window.DDBImporter.notification.show(text, null);
    }
  } catch (error) {
    logger.warn(error);
    window.DDBImporter.notification.show(`Could not retrieve latest ${MODULE_NAME} version`);
  }
};
