import logger from "../logger.js";
import { copySupportedItemFlags } from "./import.js";

export const BAD_DIRS = ["[data]", "[data] ", "", null];

export function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

/**
 * Display information when Munching
 * @param {*} note
 * @param {*} nameField
 */
export function munchNote(note, nameField = false, monsterNote = false) {
  if (nameField) {
    $("#munching-task-name").text(note);
    $("#ddb-importer-monsters").css("height", "auto");
  } else if (monsterNote) {
    $("#munching-task-monster").text(note);
    $("#ddb-importer-monsters").css("height", "auto");
  } else {
    $("#munching-task-notes").text(note);
    $("#ddb-importer-monsters").css("height", "auto");
  }
}

// a mapping of compendiums with content type
const compendiumLookup = [
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
];

export function getCompendiumLabel(type) {
  const compendiumName = compendiumLookup.find((c) => c.type == type).compendium;
  const compendiumLabel = game.settings.get("ddb-importer", compendiumName);
  return compendiumLabel;
}

export function getCompendium(label, fail = true) {
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
}

export function getCompendiumType(type, fail = true) {
  const compendiumLabel = getCompendiumLabel(type);
  logger.debug(`Getting compendium ${compendiumLabel} for update of ${type}`);
  const compendium = getCompendium(compendiumLabel, false);
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
}

export async function loadCompendiumIndex(type, indexOptions = {}) {
  const compendiumLabel = getCompendiumLabel(type);
  setProperty(CONFIG.DDBI, `compendium.label.${type}`, compendiumLabel);
  const compendium = await getCompendium(compendiumLabel);

  if (compendium) {
    const index = await compendium.getIndex(indexOptions);
    setProperty(CONFIG.DDBI, `compendium.index.${type}`, index);
    return index;
  } else {
    return undefined;
  }
}

export function getCampaignId() {
  const campaignId = game.settings.get("ddb-importer", "campaign-id").split("/").pop();

  if (campaignId && campaignId !== "" && !Number.isInteger(parseInt(campaignId))) {
    munchNote(`Campaign Id is invalid! Set to "${campaignId}", using empty string`, true);
    logger.error(`Campaign Id is invalid! Set to "${campaignId}", using empty string`);
    return "";
  } else if (campaignId.includes("join")) {
    munchNote(`Campaign URL is a join campaign link, using empty string! Set to "${campaignId}"`, true);
    logger.error(`Campaign URL is a join campaign link, using empty string! Set to "${campaignId}"`);
    return "";
  }
  return campaignId;
}

export async function getPatreonTier() {
  const customProxy = game.settings.get("ddb-importer", "custom-proxy");
  if (customProxy) return { success: true, message: "custom proxy", data: "CUSTOM" };
  const key = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { betaKey: key };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/patreon/tier`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          munchNote(`API Failure: ${data.message}`);
          reject(data.message);
        }
        let currentEmail = game.settings.get("ddb-importer", "patreon-user");
        if (data.email !== currentEmail) {
          game.settings.set("ddb-importer", "patreon-user", data.email).then(() => {
            resolve(data.data);
          });
        } else {
          resolve(data.data);
        }
      })
      .catch((error) => reject(error));
  });
}

export async function getPatreonValidity(betaKey) {
  const customProxy = game.settings.get("ddb-importer", "custom-proxy");
  if (customProxy) return { success: true, message: "custom proxy", data: true };
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { betaKey: betaKey };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/patreon/valid`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data);
      })
      .catch((error) => reject(error));
  });
}

export function getPatreonTiers(tier) {
  const godTier = tier === "GOD";
  const undyingTier = tier === "UNDYING";
  const coffeeTier = tier === "COFFEE";
  const customProxy = game.settings.get("ddb-importer", "custom-proxy");
  const custom = tier === "CUSTOM" || customProxy;

  const tiers = {
    god: godTier,
    undying: undyingTier,
    custom: custom,
    coffee: coffeeTier,
    source: godTier || undyingTier || coffeeTier || custom,
    experimentalMid: godTier || undyingTier,
    homebrew: godTier || undyingTier || coffeeTier || custom,
    all: godTier || undyingTier || coffeeTier || custom,
    supporter: godTier || undyingTier || coffeeTier,
    not: !godTier && !undyingTier && !coffeeTier && !custom,
  };

  return tiers;
}

export async function checkPatreon() {
  const tier = await getPatreonTier();
  const tiers = getPatreonTiers(tier);
  return tiers;
}

export async function setPatreonTier() {
  const tier = await getPatreonTier();
  game.settings.set("ddb-importer", "patreon-tier", tier);
}

/* eslint-disable require-atomic-updates */
async function copyExistingActorProperties(type, foundryActor) {
  const compendium = getCompendiumType(type);

  if (game.settings.get("ddb-importer", "munching-policy-update-existing")) {
    const existingNPC = await compendium.getDocument(foundryActor._id);

    const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
    if (!updateImages && existingNPC.system.img !== CONST.DEFAULT_TOKEN) {
      foundryActor.img = existingNPC.system.img;
    }
    if (!updateImages && getProperty(existingNPC, "prototypeToken.texture.src") !== CONST.DEFAULT_TOKEN) {
      foundryActor.prototypeToken.texture.src = existingNPC.prototypeToken.texture.src;
      foundryActor.token.scale = existingNPC.system.token.scale;
      foundryActor.token.randomImg = existingNPC.system.token.randomImg;
      foundryActor.token.mirrorX = existingNPC.system.token.mirrorX;
      foundryActor.token.mirrorY = existingNPC.system.token.mirrorY;
      foundryActor.token.lockRotation = existingNPC.system.token.lockRotation;
      foundryActor.token.rotation = existingNPC.system.token.rotation;
      foundryActor.token.alpha = existingNPC.system.token.alpha;
      foundryActor.token.lightAlpha = existingNPC.system.token.lightAlpha;
      foundryActor.token.lightAnimation = existingNPC.system.token.lightAnimation;
      foundryActor.token.tint = existingNPC.system.token.tint;
      foundryActor.token.lightColor = existingNPC.system.token.lightColor;
    }

    const retainBiography = game.settings.get("ddb-importer", "munching-policy-monster-retain-biography");
    if (retainBiography) {
      foundryActor.system.details.biography = existingNPC.system.details.biography;
    }

    await copySupportedItemFlags(existingNPC.toObject(), foundryActor);
  }

  return foundryActor;

}
/* eslint-enable require-atomic-updates */

export async function getActorIndexActor(type, npc) {
  const monsterIndexFields = ["name", "flags.ddbimporter.id"];
  const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
  const index = await loadCompendiumIndex(type, { fields: monsterIndexFields });
  const npcMatch = index.contents.find((entity) =>
    hasProperty(entity, "flags.ddbimporter.id") &&
    entity.flags.ddbimporter.id == npc.flags.ddbimporter.id &&
    ((!legacyName && entity.name.toLowerCase() === npc.name.toLowerCase()) ||
      (legacyName && npc.flags.ddbimporter.isLegacy && npc.name.toLowerCase().startsWith(entity.name.toLowerCase())) ||
      (legacyName && entity.name.toLowerCase() === npc.name.toLowerCase()))
  );
  return npcMatch;
}

export async function existingActorCheck(type, foundryActor) {
  const matchingActor = await getActorIndexActor(type, foundryActor);
  if (matchingActor) {
    logger.debug(`Found existing ${type}, updating: ${matchingActor.name}`);
    // eslint-disable-next-line require-atomic-updates
    foundryActor._id = matchingActor._id;
    foundryActor = await copyExistingActorProperties(type, foundryActor);
  }
  return foundryActor;
}

