import logger from '../../logger.js';
import SETTINGS from '../../settings.js';

let sanitize = (text) => {
  if (text && typeof text === "string") {
    return text.replace(/\s|\./g, '-').toLowerCase();
  }
  return text;
};

let createIfNotExists = async (settingName, compendiumType, compendiumLabel) => {
  logger.debug(`Checking if ${settingName} exists`);
  const compendiumName = game.settings.get(SETTINGS.MODULE_ID, settingName);
  const compendium = await game.packs.get(compendiumName);
  if (compendium) {
    logger.info(`Compendium '${compendiumName}' found, will not create compendium.`);
    return false;
  } else {
    logger.info(`Compendium for ${compendiumLabel}, was not found, creating it now.`);
    const sanitizedLabel = sanitize(compendiumLabel);
    const name = `ddb-${game.world.data.name}-${sanitizedLabel}`;
    const defaultCompendium = await game.packs.get(`world.${name}`);
    if (defaultCompendium) {
      logger.warn(`Could not load Compendium '${compendiumName}', and could not create default Compendium '${name}' as it already exists. Please check your DDB Importer Compendium setup.`);
    } else {
      // create a compendium for the user
      await CompendiumCollection.createCompendium({
        entity: compendiumType,
        label: `DDB ${compendiumLabel}`,
        name: name,
        package: "world",
      });
      await game.settings.set(SETTINGS.MODULE_ID, settingName, `world.${name}`);
    }
    return true;
  }
};

export function getCompendiumNames() {
  return SETTINGS.COMPENDIUMS.map((ddbCompendium) => {
    return game.settings.get(SETTINGS.MODULE_ID, ddbCompendium.setting);
  });
}

export default async function () {
  const autoCreate = game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium");

  if (autoCreate) {
    let promises = [];
    SETTINGS.COMPENDIUMS.forEach((compendium) => {
      promises.push(createIfNotExists(compendium.setting, compendium.type, compendium.title));
    });
    let results = await Promise.all(promises);

    const reload = results.some((result) => result.value);

    if (reload) {
      logger.warn("RELOADING!");
      // location.reload();
    }
  }

}
