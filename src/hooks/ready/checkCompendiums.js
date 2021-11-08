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
      await game.settings.set("ddb-importer", settingName, `world.${name}`);
    }
    return true;
  }
};

export const ddbCompendiums = [
  { name: "entity-spell-compendium", label: "Spells", type: "Item" },
  { name: "entity-item-compendium", label: "Items", type: "Item" },
  { name: "entity-monster-compendium", label: "Monsters", type: "Actor" },
  { name: "entity-feat-compendium", label: "Feats", type: "Item" },
  { name: "entity-feature-compendium", label: "Class Features", type: "Item" },
  { name: "entity-class-compendium", label: "Classes", type: "Item" },
  { name: "entity-trait-compendium", label: "Racial Traits", type: "Item" },
  { name: "entity-race-compendium", label: "Races", type: "Item" },
  { name: "entity-override-compendium", label: "Override", type: "Item" },
  { name: "entity-table-compendium", label: "Tables", type: "RollTable" },
];

export function getCompendiumNames() {
  return ddbCompendiums.map((ddbCompendium) => {
    return game.settings.get("ddb-importer", ddbCompendium.name);
  });
}

export default async function () {
  const autoCreate = game.settings.get("ddb-importer", "auto-create-compendium");

  if (autoCreate) {
    let promises = [];
    ddbCompendiums.forEach((compendium) => {
      promises.push(createIfNotExists(compendium.name, compendium.type, compendium.label));
    });
    let results = await Promise.all(promises);

    const reload = results.some((result) => result.value);

    if (reload) {
      logger.warn("RELOADING!");
      // location.reload();
    }
  }

}
