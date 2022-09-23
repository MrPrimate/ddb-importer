import logger from '../../logger.js';
import SETTINGS from '../../settings.js';

function sanitize(text) {
  if (text && typeof text === "string") {
    return text.replace(/\s|\./g, '-').toLowerCase();
  }
  return text;
}

function getDefaultCompendiumName(compendiumLabel) {
  const sanitizedLabel = sanitize(compendiumLabel);
  const name = `ddb-${game.world.id}-${sanitizedLabel}`;
  return name;
}

async function createIfNotExists(settingName, compendiumType, compendiumLabel) {
  logger.debug(`Checking if ${settingName} exists for ${SETTINGS.MODULE_ID}`);
  const compendiumName = game.settings.get(SETTINGS.MODULE_ID, settingName);
  const compendium = await game.packs.get(compendiumName);
  if (compendium) {
    logger.info(`Compendium '${compendiumName}' found, will not create compendium.`);
    return false;
  } else {
    logger.info(`Compendium for ${compendiumLabel}, was not found, creating it now.`);
    const name = getDefaultCompendiumName(compendiumLabel);
    const defaultCompendium = await game.packs.get(`world.${name}`);
    if (defaultCompendium) {
      logger.warn(`Could not load Compendium '${compendiumName}', and could not create default Compendium '${name}' as it already exists. Please check your DDB Importer Compendium setup.`);
    } else {
      // create a compendium for the user
      await CompendiumCollection.createCompendium({
        type: compendiumType,
        label: `DDB ${compendiumLabel}`,
        name: name,
        package: "world",
      });
      await game.settings.set(SETTINGS.MODULE_ID, settingName, `world.${name}`);
    }
    return true;
  }
}

export function getCompendiumNames() {
  return SETTINGS.COMPENDIUMS.map((ddbCompendium) => {
    return game.settings.get(SETTINGS.MODULE_ID, ddbCompendium.setting);
  });
}

export default async function () {
  const autoCreate = game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium");

  if (autoCreate) {
    SETTINGS.COMPENDIUMS.forEach((compendium) => {
      createIfNotExists(compendium.setting, compendium.type, compendium.title);
    });
  }
}

export function deleteDefaultCompendiums(force = true) {
  if (!force) {
    logger.warn("Pass 'true' to this function to force deletion.");
  }
  game.settings.set(SETTINGS.MODULE_ID, "auto-create-compendium", false);

  const clone = foundry.utils.deepClone(SETTINGS.DEFAULT_SETTINGS);
  const compendiumSettings = SETTINGS.APPLY_GLOBAL_DEFAULTS(clone.READY.COMPENDIUMS);

  for (const [name, data] of Object.entries(compendiumSettings)) {
    const compendiumName = getDefaultCompendiumName(data.default);

    logger.warn(`Setting: ${name} : Deleting compendium ${data.name} with key world.${compendiumName}}`);
    game.packs.delete(`world.${compendiumName}`);
  }
}
