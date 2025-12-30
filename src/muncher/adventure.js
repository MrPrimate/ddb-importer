import {
  DDBCampaigns,
  Secrets,
  FileHelper,
  CompendiumHelper,
  DDBProxy,
} from "../lib/_module.mjs";
import DDBVehicleFactory from "../parser/DDBVehicleFactory.mjs";


async function getMonsterMap () {
  // ddb://monsters
  const monsterCompendiumLabel = CompendiumHelper.getCompendiumLabel("monster");
  const monsterCompendium = CompendiumHelper.getCompendium(monsterCompendiumLabel);
  const monsterIndices = ["name", "flags.ddbimporter.id", "flags.ddbbimporter.originalName", "system.source.rules"];
  const monsterIndex = await monsterCompendium.getIndex({ fields: monsterIndices });

  const results = monsterIndex
    .filter((monster) => monster.flags?.ddbimporter?.id)
    .map((monster) => {
      return {
        id: monster.flags.ddbimporter.id,
        _id: monster._id,
        compendium: monsterCompendiumLabel,
        name: monster.name,
        documentName: monster.flags?.ddbimporter?.originalName ?? monster.name,
        rules: monster.system?.source?.rules,
        uuid: monster.uuid,
      };
    });

  return Promise.all(results);
}

async function getSpellMap() {
  // ddb://spells
  // mm 2176
  const spellCompendiumLabel = await game.settings.get("ddb-importer", "entity-spell-compendium");
  const spellCompendium = await game.packs.find((pack) => pack.collection === spellCompendiumLabel);
  const spellIndices = ["name", "flags.ddbimporter.definitionId", "flags.ddbbimporter.originalName", "system.source.rules"];
  const spellIndex = await spellCompendium.getIndex({ fields: spellIndices });

  const results = spellIndex
    .filter((spell) => spell.flags?.ddbimporter?.definitionId)
    .map((spell) => {
      return {
        id: spell.flags.ddbimporter.definitionId,
        _id: spell._id,
        compendium: spellCompendiumLabel,
        name: spell.flags?.ddbimporter?.originalName ?? spell.name,
        documentName: spell.name,
        rules: spell.system?.source?.rules,
        uuid: spell.uuid,
      };
    });

  return Promise.all(results);
}

async function getItemMap() {
  // ddb://magicitems
  const itemCompendiumLabel = await game.settings.get("ddb-importer", "entity-item-compendium");
  const itemCompendium = await game.packs.find((pack) => pack.collection === itemCompendiumLabel);
  const itemIndices = ["name", "flags.ddbimporter.definitionId", "flags.ddbbimporter.originalName", "system.source.rules"];
  const itemIndex = await itemCompendium.getIndex({ fields: itemIndices });

  const results = itemIndex
    .filter((i) => i.flags?.ddbimporter?.definitionId)
    .map((i) => {
      return {
        id: i.flags.ddbimporter.definitionId,
        _id: i._id,
        compendium: itemCompendiumLabel,
        name: i.name,
        documentName: i.flags?.ddbimporter?.originalName ?? i.name,
        rules: i.system?.source?.rules,
        uuid: i.uuid,
      };
    });

  return Promise.all(results);
}

const ATTACK_ACTION_MAP = {
  "Opportunity Attack": {
    hint: "Opportunity Attacks",
    page: "Making an Attack",
  },
  Grapple: {
    hint: "Grappling",
    page: "Making an Attack",
  },
  Shove: {
    hint: "Shoving a Creature",
    page: "Making an Attack",
  },
  "Two-Weapon Fighting": {
    hint: "Two-Weapon Fighting",
    page: "Making an Attack",
  },
  "Interact with an Object": {
    hint: "Use an Object",
    page: "Actions in Combat",
  },
};

export async function generateAdventureConfig(full = false, cobalt = true, fullPageMap = false, legacy = false) {
  const result = {
    schemaVersion: CONFIG.DDBI.schemaVersion,
    debug: false,
    observeAll: false,
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
      rule: [],
    },
    fullPageMap: [],
  };

  if (cobalt) {
    result.cobalt = Secrets.getCobalt();
    result.campaignId = DDBCampaigns.getCampaignId();
  }

  // @Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}

  if (full) {
    result.lookups.monsters = await getMonsterMap();
    result.lookups.spells = await getSpellMap();
    result.lookups.items = await getItemMap();
  }

  // vehicles
  if (!DDBProxy.isCustom(true) && cobalt) {
    const vehicleFactory = new DDBVehicleFactory();
    await vehicleFactory.fetchDDBVehicleSourceData();
    result.lookups.vehicles = vehicleFactory.source.map((v) => {
      return {
        id: v.id,
        url: v.url,
        name: v.name,
        uuid: v.uuid,
      };
    });
  }

  if (legacy) {
    const rulesCompendium = "dnd5e.rules";
    const srdCompendium = CompendiumHelper.getCompendium(rulesCompendium);
    if (!srdCompendium) return result;

    const srdIndex = await srdCompendium.getIndex();
    const srdDocuments = await srdCompendium.getDocuments();
    result.index = srdIndex;

    const skillEntryDocument = srdDocuments.find((d) => d.name === "Chapter 7: Using Ability Scores");
    if (skillEntryDocument) {
      result.lookups.skills = CONFIG.DDB.abilitySkills.map((skill) => {
        const skillEntryPage = skillEntryDocument.pages.find((p) => p.name === "Using Each Ability");
        const stat = CONFIG.DDB.stats.find((s) => s.id === skill.stat);
        const headerLink = `${stat.name} Checks`;
        return {
          id: skill.id,
          _id: skillEntryDocument._id,
          name: skill.name,
          compendium: rulesCompendium,
          documentName: skillEntryDocument.name,
          pageId: skillEntryPage._id,
          headerLink,
        };
      });
    }

    const senseEntryDocument = srdDocuments.find((d) => d.name === "Appendix D: Senses and Speeds");
    if (senseEntryDocument) {
      result.lookups.senses = CONFIG.DDB.senses
        .filter((sense) => senseEntryDocument.pages.some((p) => p.name === sense.name))
        .map((sense) => {
          const senseEntryPage = senseEntryDocument.pages.find((p) => p.name === sense.name);
          return {
            id: sense.id,
            _id: senseEntryDocument._id,
            name: sense.name,
            compendium: rulesCompendium,
            documentName: senseEntryDocument.name,
            pageId: senseEntryPage._id,
            headerLink: null,
          };
        });
    }

    const conditionEntryDocument = srdDocuments.find((d) => d.name === "Appendix A: Conditions");
    if (conditionEntryDocument) {
      result.lookups.conditions = CONFIG.DDB.conditions
        .filter((condition) => conditionEntryDocument.pages.some((p) => p.name.trim() === condition.definition.name.trim()))
        .map((condition) => {
          const conditionEntryPage = conditionEntryDocument.pages.find((p) => p.name.trim() === condition.definition.name.trim());
          return {
            id: condition.definition.id,
            _id: conditionEntryDocument.id,
            name: condition.definition.name,
            compendium: rulesCompendium,
            slug: condition.definition.slug,
            documentName: conditionEntryDocument.name,
            pageId: conditionEntryPage._id,
            headerLink: null,
          };
        });
    }

    const actionEntryDocument = srdDocuments.find((d) => d.name === "Chapter 9: Combat");
    if (actionEntryDocument) {
      const actionEntryPage = actionEntryDocument.pages.find((p) => p.name === "Actions in Combat");
      CONFIG.DDB.basicActions.forEach((action) => {
        if (ATTACK_ACTION_MAP[action.name]) {
          const attackEntryPage = actionEntryDocument.pages.find((p) => p.name === ATTACK_ACTION_MAP[action.name].page);
          result.lookups.actions.push({
            id: action.id,
            _id: actionEntryDocument._id,
            name: action.name,
            compendium: rulesCompendium,
            documentName: actionEntryDocument.name,
            pageId: attackEntryPage._id,
            headerLink: ATTACK_ACTION_MAP[action.name].hint,
          });
        } else if (action.id < 100) {
          result.lookups.actions.push({
            id: action.id,
            _id: actionEntryDocument.id,
            name: action.name,
            compendium: rulesCompendium,
            documentName: actionEntryDocument.name,
            pageId: actionEntryPage._id,
            headerLink: action.name,
          });
        }
      });
    }

    const equipmentDocument = srdDocuments.find((d) => d.name === "Chapter 5: Equipment");
    if (equipmentDocument) {
      const weaponPropertiesPage = equipmentDocument.pages.find((p) => p.name === "Weapons");
      result.lookups.weaponproperties = CONFIG.DDB.weaponProperties.map((prop) => {
        return {
          id: prop.id,
          _id: equipmentDocument._id,
          name: prop.name,
          compendium: rulesCompendium,
          documentName: equipmentDocument.name,
          pageId: weaponPropertiesPage._id,
          headerLink: "Weapon Properties",
        };
      });
    }

    if (fullPageMap) {
      srdDocuments.forEach((document) => {
        document.pages.forEach((page) => {
          result.fullPageMap.push({
            id: null,
            _id: document.id,
            name: page.name,
            compendium: rulesCompendium,
            documentName: document.name,
            pageId: page._id,
            headerLink: null,
          });
        });
      });
    }
  }

  return result;

}

export async function downloadAdventureConfig() {
  const fullConfig = game.settings.get("ddb-importer", "adventure-muncher-full-config");
  const result = await generateAdventureConfig(fullConfig);
  FileHelper.download(JSON.stringify(result, null, 4), `adventure-config.json`, "application/json");
  return result;
}
