import utils from "../../lib/utils.js";
import logger from "../../logger.js";

const MODULE_TITLE = "DDB Importer";
const MODULE_NAME = "ddb-importer";
const MODULE_AUTHOR = "MrPrimate";
const _GITHUB_API_LATEST = `https://api.github.com/repos/${MODULE_AUTHOR}/${MODULE_NAME}/releases/latest`;
const _GITHUB_MODULE_JSON_LATEST = `https://raw.githubusercontent.com/${MODULE_AUTHOR}/${MODULE_NAME}/master/module-template.json`;
const MINIMUM_5E_VERSION = "3.0.0";
const PREVIOUS_VERSION = "3.7.17";

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
async function getCompatibility() {
  try {
    const { compatibility, relationships } = await $.getJSON(_GITHUB_MODULE_JSON_LATEST);
    return { minimumCoreVersion: compatibility.minimum, minimumSystemVersion: relationships.systems[0].compatibility.minimum };
  } catch (error) {
    logger.error(error);
  }
}

export default async () => {
  const moduleInfo = game.modules.get(MODULE_NAME);
  const installedVersion = moduleInfo.version;
  foundry.utils.setProperty(CONFIG, "DDBI.version", installedVersion);
  try {
    if (!game.user.isGM) return;
    const compatibleMinimumSystem = utils.versionCompare(game.data.system.version, MINIMUM_5E_VERSION) >= 0;

    if (!compatibleMinimumSystem) {
      ui.notifications.error(`${MODULE_TITLE} requires 5e system v${MINIMUM_5E_VERSION} to run correctly. Please update your 5e version, or roll DDB Importer back to version ${PREVIOUS_VERSION}.`, { permanent: true });
      return;
    }

    // check version number only for GMs
    const coreCheck = game.settings.get("ddb-importer", "update-check");
    if (!coreCheck) return;
    const { minimumCoreVersion, minimumSystemVersion } = await getCompatibility();
    const { latestVersion, prerelease: preRelease } = await getLatestModuleVersion();

    const newModuleVersion = utils.versionCompare(latestVersion, installedVersion) === 1;
    const compatibleSystem = utils.versionCompare(game.version, minimumSystemVersion) >= 0;
    const compatibleMinimumCore = utils.versionCompare(game.version, minimumCoreVersion) >= 0;

    const needToUpdate = newModuleVersion && compatibleSystem && compatibleMinimumCore;

    logger.debug("Module Update data", {
      newModuleVersion,
      compatibleSystem,
      compatibleMinimumCore,
      needToUpdate,
      minimumCoreVersion,
      minimumSystemVersion
    });

    if (preRelease) logger.debug(`Prerelease of ${MODULE_TITLE} detected`);

    if (needToUpdate) {
      let text = $(
        `<h2>${MODULE_TITLE} Update!</h2><p>A new <b>${MODULE_NAME}</b> version is available. Please update to <b>v${latestVersion}</b> if you are experiencing issues and before reporting a bug.</p>`
      );
      game.modules.get("ddb-importer").api?.notification.show(text, null);
    }
  } catch (error) {
    logger.warn(error);
    game.modules.get("ddb-importer").api?.notification.show(`Could not retrieve latest ${MODULE_NAME} version`);
  }
};
