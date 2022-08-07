import { getCampaignId, download, getCompendium, getCompendiumLabel } from "./utils.js";
import { getCobalt } from "../lib/Secrets.js";
import { getVehicleData } from "./vehicles.js";

async function getMonsterMap () {
  // ddb://monsters
  const monsterCompendiumLabel = getCompendiumLabel("monster");
  const monsterCompendium = await getCompendium(monsterCompendiumLabel);
  const monsterIndices = ["name", "flags.ddbimporter.id"];
  const monsterIndex = await monsterCompendium.getIndex({ fields: monsterIndices });

  const results = monsterIndex
    .filter((monster) => monster.flags?.ddbimporter?.id)
    .map((monster) => {
      return {
        id: monster.flags.ddbimporter.id,
        _id: monster._id,
        compendium: monsterCompendiumLabel,
        name: monster.name,
        documentName: monster.name,
      };
    });

  return Promise.all(results);
}

async function getSpellMap() {
  // ddb://spells
  // mm 2176
  const spellCompendiumLabel = await game.settings.get("ddb-importer", "entity-spell-compendium");
  const spellCompendium = await game.packs.find((pack) => pack.collection === spellCompendiumLabel);
  const spellIndices = ["name", "flags.ddbimporter.definitionId"];
  const spellIndex = await spellCompendium.getIndex({ fields: spellIndices });

  const results = spellIndex
    .filter((spell) => spell.flags?.ddbimporter?.definitionId)
    .map((spell) => {
      return {
        id: spell.flags.ddbimporter.definitionId,
        _id: spell._id,
        compendium: spellCompendiumLabel,
        name: spell.name,
        documentName: spell.name,
      };
    });

  return Promise.all(results);
}

async function getItemMap() {
  // ddb://magicitems
  const itemCompendiumLabel = await game.settings.get("ddb-importer", "entity-item-compendium");
  const itemCompendium = await game.packs.find((pack) => pack.collection === itemCompendiumLabel);
  const itemIndices = ["name", "flags.ddbimporter.definitionId"];
  const itemIndex = await itemCompendium.getIndex({ fields: itemIndices });

  const results = itemIndex
    .filter((item) => item.flags?.ddbimporter?.definitionId)
    .map((item) => {
      return {
        id: item.flags.ddbimporter.definitionId,
        _id: item._id,
        compendium: itemCompendiumLabel,
        name: item.name,
        documentName: item.name,
      };
    });

  return Promise.all(results);
}

export async function generateAdventureConfig(full = true, cobalt = true) {
  const customProxy = game.settings.get("ddb-importer", "custom-proxy");

  const result = {
    generateTokens: true,
    version: game.modules.get("ddb-importer").version,
    lookups: {
      monsters: [],
      items: [],
      spells: [],
      skills: [],
      senses: [],
      conditions: [],
      actions: [],
      weaponproperties: [],
      vehicles: [],
    }
  };

  if (cobalt) {
    result.cobalt = getCobalt();
    result.campaignId = getCampaignId();
  }

  // @Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}

  if (full) {
    result.lookups.monsters = await getMonsterMap();
    result.lookups.spells = await getSpellMap();
    result.lookups.items = await getItemMap();
  }

  const rulesCompendium = "dnd5e.rules";
  const srdCompendium = await getCompendium(rulesCompendium);
  const srdIndex = await srdCompendium.getIndex();
  result.index = srdIndex;

  const skillEntry = srdIndex.find((i) => i.name === "Using Each Ability");
  if (skillEntry) {
    result.lookups.skills = CONFIG.DDB.abilitySkills.map((skill) => {
      return {
        id: skill.id,
        _id: skillEntry.id,
        name: skill.name,
        compendium: rulesCompendium,
        documentName: skillEntry.name,
      };
    });
  }

  result.lookups.senses = CONFIG.DDB.senses.filter((sense) => srdIndex.some((i) => i.name === sense.name))
    .map((sense) => {
      const entry = srdIndex.find((i) => i.name === sense.name);
      return {
        id: sense.id,
        _id: entry.id,
        name: sense.name,
        compendium: rulesCompendium,
        documentName: entry.name,
      };
    });

  result.lookups.conditions = CONFIG.DDB.conditions.filter((condition) => srdIndex.some((i) => i.name.trim() === condition.definition.name.trim()))
    .map((condition) => {
      const entry = srdIndex.find((i) => i.name.trim() === condition.definition.name.trim());
      return {
        id: condition.definition.id,
        _id: entry.id,
        name: condition.definition.name,
        compendium: rulesCompendium,
        slug: condition.definition.slug,
        documentName: entry.name,
      };
    });

  const actionEntry = srdIndex.find((i) => i.name === "Actions in Combat");
  if (actionEntry) {
    result.lookups.actions = CONFIG.DDB.basicActions.map((action) => {
      return {
        id: action.id,
        _id: actionEntry.id,
        name: action.name,
        compendium: rulesCompendium,
        documentName: actionEntry.name,
      };
    });
  }

  const weaponPropertiesEntry = srdIndex.find((i) => i.name === "Weapons");
  if (weaponPropertiesEntry) {
    result.lookups.weaponproperties = CONFIG.DDB.weaponProperties.map((prop) => {
      return {
        id: prop.id,
        _id: weaponPropertiesEntry.id,
        name: prop.name,
        compendium: rulesCompendium,
        documentName: weaponPropertiesEntry.name,
      };
    });
  }

  // vehicles
  if (!customProxy && cobalt) {
    const vehicleData = await getVehicleData();

    result.lookups.vehicles = vehicleData.map((v) => {
      return {
        id: v.id,
        url: v.url,
        name: v.name,
      };
    });
  }

  return result;

}

export async function downloadAdventureConfig() {
  const fullConfig = game.settings.get("ddb-importer", "adventure-muncher-full-config");
  const result = await generateAdventureConfig(fullConfig);
  download(JSON.stringify(result, null, 4), `adventure-config.json`, "application/json");
  return result;
}
