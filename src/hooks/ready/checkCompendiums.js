import logger from '../../logger.js';

let sanitize = (text) => {
  if (text && typeof text === "string") {
    return text.replace(/\s/g, '-').toLowerCase();
  }
  return text;
};

let createIfNotExists = async (settingName, compendiumType, compendiumLabel) => {
  const compendiumName = game.settings.get("ddb-importer", settingName);
  const compendium = await game.packs.get(compendiumName);
  if (compendium) {
    logger.info(`Compendium '${compendiumName}' found, will not create compendium.`);
    return false;
  } else {
    logger.info(`Compendium for ${compendiumLabel}, was not found, creating it now.`);
    const sanitizedLabel = sanitize(compendiumLabel);
    // create a compendium for the user
    await CompendiumCollection.createCompendium({
      entity: compendiumType,
      label: `DDB ${compendiumLabel}`,
      name: `ddb-${game.world.data.name}-${sanitizedLabel}`,
      package: "world",
    });
    await game.settings.set("ddb-importer", settingName, `world.ddb-${game.world.data.name}-${sanitizedLabel}`);
    return true;
  }
};


export default async function () {
  const autoCreate = game.settings.get("ddb-importer", "auto-create-compendium");

  if (autoCreate) {
    let results = await Promise.all([
      createIfNotExists("entity-spell-compendium", "Item", "Spells"),
      createIfNotExists("entity-item-compendium", "Item", "Items"),
      createIfNotExists("entity-feature-compendium", "Item", "Class Features"),
      createIfNotExists("entity-class-compendium", "Item", "Classes"),
      createIfNotExists("entity-trait-compendium", "Item", "Racial Traits"),
      createIfNotExists("entity-feat-compendium", "Item", "Feats"),
      createIfNotExists("entity-race-compendium", "Item", "Races"),
      createIfNotExists("entity-monster-compendium", "Actor", "Monsters"),
      createIfNotExists("entity-override-compendium", "Item", "Override"),
    ]);

    const reload = results.some((result) => result.value);

    if (reload) {
      logger.warn("RELOADING!");
      location.reload();
    }
  }

}
