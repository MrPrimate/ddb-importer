import logger from "../logger.js";
import { copySupportedItemFlags } from "../muncher/import.js";
import SETTINGS from '../settings.js';

const CompendiumHelper = {

  // a mapping of compendiums with content type
  LOOKUP: [
    { type: "spells", compendium: "entity-spell-compendium" },
    { type: "spell", compendium: "entity-spell-compendium" },
    { type: "feats", compendium: "entity-feat-compendium" },
    { type: "features", compendium: "entity-feature-compendium" },
    { type: "feature", compendium: "entity-feature-compendium" },
    { type: "feat", compendium: "entity-feature-compendium" },
    { type: "classes", compendium: "entity-class-compendium" },
    { type: "class", compendium: "entity-class-compendium" },
    { type: "subclasses", compendium: "entity-subclass-compendium" },
    { type: "subclass", compendium: "entity-subclass-compendium" },
    { type: "races", compendium: "entity-race-compendium" },
    { type: "race", compendium: "entity-race-compendium" },
    { type: "traits", compendium: "entity-trait-compendium" },
    { type: "trait", compendium: "entity-trait-compendium" },
    { type: "npc", compendium: "entity-monster-compendium" },
    { type: "monsters", compendium: "entity-monster-compendium" },
    { type: "monster", compendium: "entity-monster-compendium" },
    { type: "custom", compendium: "entity-override-compendium" },
    { type: "override", compendium: "entity-override-compendium" },
    { type: "inventory", compendium: "entity-item-compendium" },
    { type: "item", compendium: "entity-item-compendium" },
    { type: "items", compendium: "entity-item-compendium" },
    { type: "magicitem", compendium: "entity-item-compendium" },
    { type: "weapon", compendium: "entity-item-compendium" },
    { type: "consumable", compendium: "entity-item-compendium" },
    { type: "tool", compendium: "entity-item-compendium" },
    { type: "loot", compendium: "entity-item-compendium" },
    { type: "backpack", compendium: "entity-item-compendium" },
    { type: "spell", compendium: "entity-spell-compendium" },
    { type: "equipment", compendium: "entity-item-compendium" },
    { type: "table", compendium: "entity-table-compendium" },
    { type: "tables", compendium: "entity-table-compendium" },
    { type: "background", compendium: "entity-background-compendium" },
    { type: "backgrounds", compendium: "entity-background-compendium" },
    { type: "vehicle", compendium: "entity-vehicle-compendium" },
    { type: "vehicles", compendium: "entity-vehicle-compendium" },
  ],

  getCompendiumLabel: (type) => {
    const compendiumName = CompendiumHelper.LOOKUP.find((c) => c.type == type).compendium;
    const compendiumLabel = game.settings.get("ddb-importer", compendiumName);
    return compendiumLabel;
  },

  getCompendium: (label, fail = true) => {
    const compendium = game.packs.get(label);
    if (compendium) {
      return compendium;
    } else {
      if (fail) {
        logger.error(`Unable to find compendium ${label}`);
        ui.notifications.error(`Unable to open the Compendium ${label}. Check the compendium exists and is set in "Module Settings > DDB Importer > Compendiums"`);
        throw new Error(`Unable to open the Compendium ${label}. Check the compendium exists and is set in "Module Settings > DDB Importer > Compendiums".`);
      }
      return undefined;
    }
  },

  getCompendiumType: (type, fail = true) => {
    const compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
    logger.debug(`Getting compendium ${compendiumLabel} for update of ${type}`);
    const compendium = CompendiumHelper.getCompendium(compendiumLabel, false);
    if (compendium) {
      return compendium;
    } else {
      logger.error(`Unable to find compendium ${compendiumLabel} for ${type} documents`);
      ui.notifications.error(`Unable to open the Compendium ${compendiumLabel}. Check the compendium exists and is set in "Module Settings > DDB Importer > Compendiums"`);
      if (fail) {
        throw new Error(`Unable to open the Compendium ${compendiumLabel}. Check the compendium exists and is set in "Module Settings > DDB Importer > Compendiums"`);
      }
      return undefined;
    }
  },

  loadCompendiumIndex: async (type, indexOptions = {}) => {
    const compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
    setProperty(CONFIG.DDBI, `compendium.label.${type}`, compendiumLabel);
    const compendium = await CompendiumHelper.getCompendium(compendiumLabel);

    if (compendium) {
      const index = await compendium.getIndex(indexOptions);
      setProperty(CONFIG.DDBI, `compendium.index.${type}`, index);
      return index;
    } else {
      return undefined;
    }
  },

  /* eslint-disable require-atomic-updates */
  copyExistingActorProperties: async (type, foundryActor) => {
    const compendium = CompendiumHelper.getCompendiumType(type);

    if (game.settings.get("ddb-importer", "munching-policy-update-existing")) {
      const existingNPC = await compendium.getDocument(foundryActor._id);

      const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
      if (!updateImages && existingNPC.system.img !== CONST.DEFAULT_TOKEN) {
        foundryActor.img = existingNPC.system.img;
      }
      if (!updateImages && getProperty(existingNPC, "prototypeToken.texture.src") !== CONST.DEFAULT_TOKEN) {
        foundryActor.prototypeToken.texture.src = existingNPC.prototypeToken.texture.src;
        foundryActor.prototypeToken.scale = existingNPC.prototypeToken.scale;
        foundryActor.prototypeToken.randomImg = existingNPC.prototypeToken.randomImg;
        foundryActor.prototypeToken.mirrorX = existingNPC.prototypeToken.mirrorX;
        foundryActor.prototypeToken.mirrorY = existingNPC.prototypeToken.mirrorY;
        foundryActor.prototypeToken.lockRotation = existingNPC.prototypeToken.lockRotation;
        foundryActor.prototypeToken.rotation = existingNPC.prototypeToken.rotation;
        foundryActor.prototypeToken.alpha = existingNPC.prototypeToken.alpha;
        foundryActor.prototypeToken.lightAlpha = existingNPC.prototypeToken.lightAlpha;
        foundryActor.prototypeToken.lightAnimation = existingNPC.prototypeToken.lightAnimation;
        foundryActor.prototypeToken.tint = existingNPC.prototypeToken.tint;
        foundryActor.prototypeToken.lightColor = existingNPC.prototypeToken.lightColor;
      }

      const retainBiography = game.settings.get("ddb-importer", "munching-policy-monster-retain-biography");
      if (retainBiography) {
        foundryActor.system.details.biography = existingNPC.system.details.biography;
      }

      await copySupportedItemFlags(existingNPC.toObject(), foundryActor);
    }

    return foundryActor;

  },
  /* eslint-enable require-atomic-updates */

  getActorIndexActor: async (type, npc) => {
    const monsterIndexFields = ["name", "flags.ddbimporter.id"];
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    const index = await CompendiumHelper.loadCompendiumIndex(type, { fields: monsterIndexFields });
    const npcMatch = index.contents.find((entity) =>
      hasProperty(entity, "flags.ddbimporter.id")
      && entity.flags.ddbimporter.id == npc.flags.ddbimporter.id
      && ((!legacyName && entity.name.toLowerCase() === npc.name.toLowerCase())
        || (legacyName && npc.flags.ddbimporter.isLegacy && npc.name.toLowerCase().startsWith(entity.name.toLowerCase()))
        || (legacyName && entity.name.toLowerCase() === npc.name.toLowerCase()))
    );
    return npcMatch;
  },

  existingActorCheck: async (type, foundryActor) => {
    const matchingActor = await CompendiumHelper.getActorIndexActor(type, foundryActor);
    if (matchingActor) {
      logger.debug(`Found existing ${type}, updating: ${matchingActor.name}`);
      // eslint-disable-next-line require-atomic-updates
      foundryActor._id = matchingActor._id;
      foundryActor = await CompendiumHelper.copyExistingActorProperties(type, foundryActor);
    }
    return foundryActor;
  },


  sanitize: (text) => {
    if (text && typeof text === "string") {
      return text.replace(/\s|\./g, '-').toLowerCase();
    }
    return text;
  },

  getDefaultCompendiumName: (compendiumLabel) => {
    const sanitizedLabel = CompendiumHelper.sanitize(compendiumLabel);
    const name = `ddb-${game.world.id}-${sanitizedLabel}`;
    return name;
  },

  createIfNotExists: async (settingName, compendiumType, compendiumLabel) => {
    logger.debug(`Checking if ${settingName} exists for ${SETTINGS.MODULE_ID}`);
    const compendiumName = game.settings.get(SETTINGS.MODULE_ID, settingName);
    const compendium = await game.packs.get(compendiumName);
    if (compendium) {
      logger.info(`Compendium '${compendiumName}' found, will not create compendium.`);
      return false;
    } else {
      logger.info(`Compendium for ${compendiumLabel}, was not found, creating it now.`);
      const name = CompendiumHelper.getDefaultCompendiumName(compendiumLabel);
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
  },

  getCompendiumNames: () => {
    return SETTINGS.COMPENDIUMS.map((ddbCompendium) => {
      return game.settings.get(SETTINGS.MODULE_ID, ddbCompendium.setting);
    });
  },

  deleteDefaultCompendiums: (force = true) => {
    if (!force) {
      logger.warn("Pass 'true' to this function to force deletion.");
    }
    game.settings.set(SETTINGS.MODULE_ID, "auto-create-compendium", false);

    const clone = foundry.utils.deepClone(SETTINGS.DEFAULT_SETTINGS);
    const compendiumSettings = SETTINGS.APPLY_GLOBAL_DEFAULTS(clone.READY.COMPENDIUMS);

    for (const [name, data] of Object.entries(compendiumSettings)) {
      const compendiumName = CompendiumHelper.getDefaultCompendiumName(data.default);

      logger.warn(`Setting: ${name} : Deleting compendium ${data.name} with key world.${compendiumName}}`);
      game.packs.delete(`world.${compendiumName}`);
    }
  },

};

export default CompendiumHelper;
