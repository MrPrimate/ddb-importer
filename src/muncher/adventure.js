import { DDB_CONFIG } from "../ddb-config.js";
import { munchNote, getCampaignId, download } from "./utils.js";
import { getCobalt } from "../lib/Secrets.js";

function getVehicleData() {
  const cobaltCookie = getCobalt();
  const campaignId = getCampaignId();
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          download(JSON.stringify(data), `vehicles-raw.json`, "application/json");
        }
        if (!data.success) {
          munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => reject(error));
  });
}


async function getMonsterMap () {
  // ddb://monsters
  const monsterCompendiumLabel = await game.settings.get("ddb-importer", "entity-monster-compendium");
  const monsterCompendium = await game.packs.get(monsterCompendiumLabel);
  const monsterIndex = await monsterCompendium.getIndex();

  const results = monsterIndex.map(async (i) => {
    const monster = await monsterCompendium.getDocument(i._id);
    return {
      id: monster.flags.ddbimporter?.id,
      _id: monster._id,
      compendium: monsterCompendiumLabel,
      name: monster.name,
      token: monster.token,
    };
  });

  return Promise.all(results);
}

async function getSpellMap() {
  // ddb://spells
  // mm 2176
  const spellCompendiumLabel = await game.settings.get("ddb-importer", "entity-spell-compendium");
  const spellCompendium = await game.packs.find((pack) => pack.collection === spellCompendiumLabel);
  const spellIndex = await spellCompendium.getIndex();

  const results = spellIndex.map(async (i) => {
    const spell = await spellCompendium.getEntry(i._id);
    return {
      id: spell.flags.ddbimporter?.definitionId,
      _id: spell._id,
      compendium: spellCompendiumLabel,
      name: spell.name,
    };
  });

  return Promise.all(results);
}

async function getItemMap() {
  // ddb://magicitems
  const itemCompendiumLabel = await game.settings.get("ddb-importer", "entity-item-compendium");
  const itemCompendium = await game.packs.find((pack) => pack.collection === itemCompendiumLabel);
  const itemIndex = await itemCompendium.getIndex();

  const results = itemIndex.map(async (i) => {
    const item = await itemCompendium.getEntry(i._id);
    return {
      id: item.flags.ddbimporter?.definitionId,
      _id: item._id,
      compendium: itemCompendiumLabel,
      name: item.name,
    };
  });

  return Promise.all(results);
}

export async function generateAdventureConfig() {

  const result = {
    cobalt: getCobalt(),
    campaignId: getCampaignId(),
    version: game.modules.get("ddb-importer").data.version,
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

  // @Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}

  result.lookups.monsters = await getMonsterMap();
  result.lookups.spells = await getSpellMap();
  result.lookups.items = await getItemMap();

  const rulesCompendium = "dnd5e.rules";
  const srdCompendium = await game.packs.get(rulesCompendium);
  const srdIndex = await srdCompendium.getIndex();

  const skillEntry = srdIndex.find((i) => i.name === "Using Each Ability");
  result.lookups.skills = DDB_CONFIG.abilitySkills.map((skill) => {
    return {
      id: skill.id,
      _id: skillEntry._id,
      name: skill.name,
      compendium: rulesCompendium,
    };
  });
  result.lookups.senses = DDB_CONFIG.senses.filter((sense) => srdIndex.some((i) => i.name === sense.name))
    .map((sense) => {
      const entry = srdIndex.find((i) => i.name === sense.name);
      return {
        id: sense.id,
        _id: entry._id,
        name: sense.name,
        compendium: rulesCompendium,
      };
    });

  result.lookups.conditions = DDB_CONFIG.conditions.filter((condition) => srdIndex.some((i) => i.name.trim() === condition.definition.name.trim()))
    .map((condition) => {
      const entry = srdIndex.find((i) => i.name.trim() === condition.definition.name.trim());
      return {
        id: condition.definition.id,
        _id: entry._id,
        name: condition.definition.name,
        compendium: rulesCompendium,
        slug: condition.definition.slug,
      };
    });

  const actionEntry = srdIndex.find((i) => i.name === "Actions in Combat");
  result.lookups.actions = DDB_CONFIG.basicActions.map((action) => {
    return {
      id: action.id,
      _id: actionEntry._id,
      name: action.name,
      compendium: rulesCompendium,
    };
  });

  const weaponPropertiesEntry = srdIndex.find((i) => i.name === "Weapons");
  result.lookups.weaponproperties = DDB_CONFIG.weaponProperties.map((prop) => {
    return {
      id: prop.id,
      _id: weaponPropertiesEntry._id,
      name: prop.name,
      compendium: rulesCompendium,
    };
  });

  // await Promise.all(result.lookups.monsters, result.lookups.spells, result.lookups.items);

  // vehicles
  const vehicleData = await getVehicleData();

  result.lookups.vehicles = vehicleData.map((v) => {
    return {
      id: v.id,
      url: v.url,
      name: v.name,
    };
  });

  download(JSON.stringify(result), `adventure-config.json`, "application/json");
  return result;

}
