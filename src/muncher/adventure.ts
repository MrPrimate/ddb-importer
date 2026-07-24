import {
  DDBCampaigns,
  Secrets,
  FileHelper,
  CompendiumHelper,
  DDBProxy,
  logger,
  utils,
} from "../lib/_module";
import DDBVehicleFactory from "../parser/DDBVehicleFactory";

/** compendium index entry shape used by the adventure lookup maps */
interface IAdventureIndexEntry {
  _id: string;
  name: string;
  uuid: string;
  flags?: { ddbimporter?: { id?: number; definitionId?: number; originalName?: string } };
  system?: { source?: { rules?: string } };
}

/** minimal journal entry page shape used by the srd rules lookups */
interface IAdventureJournalPage {
  _id: string;
  name: string;
}

interface IAdventureConfigResult {
  schemaVersion: number;
  debug: boolean;
  observeAll: boolean;
  version: string;
  lookups: Record<string, any[]>;
  fullPageMap: any[];
  monstersToReplace: any[];
  cobalt: string | null;
  campaignId: string | null;
  /** set when generating legacy config: the srd rules compendium index */
  index?: CompendiumCollection.IndexEntry[];
}


async function getMonsterMap () {
  // ddb://monsters
  const monsterCompendiumLabel = CompendiumHelper.getCompendiumLabel("monster");
  const monsterCompendium = CompendiumHelper.getCompendium(monsterCompendiumLabel);
  if (!monsterCompendium) {
    // getCompendium throws when it fails to find the compendium, so this is unreachable
    logger.warn(`Unable to find monster compendium ${monsterCompendiumLabel}`);
    return [];
  }
  const monsterIndices = ["name", "flags.ddbimporter.id", "flags.ddbbimporter.originalName", "system.source.rules"];
  const monsterIndex = await monsterCompendium.getIndex({ fields: monsterIndices }) as unknown as IAdventureIndexEntry[];

  const results = monsterIndex
    .filter((monster) => monster.flags?.ddbimporter?.id)
    .map((monster) => {
      return {
        id: monster.flags?.ddbimporter?.id,
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
  const spellCompendiumLabel = await utils.getSetting<string>("entity-spell-compendium");
  const spellCompendium = await game.packs.find((pack) => pack.collection === spellCompendiumLabel);
  if (!spellCompendium) {
    logger.warn(`Unable to find spell compendium ${spellCompendiumLabel}`);
    return [];
  }
  const spellIndices = ["name", "flags.ddbimporter.definitionId", "flags.ddbbimporter.originalName", "system.source.rules"];
  const spellIndex = await spellCompendium.getIndex({ fields: spellIndices }) as unknown as IAdventureIndexEntry[];

  const results = spellIndex
    .filter((spell) => spell.flags?.ddbimporter?.definitionId)
    .map((spell) => {
      return {
        id: spell.flags?.ddbimporter?.definitionId,
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
  const itemCompendiumLabel = await utils.getSetting<string>("entity-item-compendium");
  const itemCompendium = await game.packs.find((pack) => pack.collection === itemCompendiumLabel);
  if (!itemCompendium) {
    logger.warn(`Unable to find item compendium ${itemCompendiumLabel}`);
    return [];
  }
  const itemIndices = ["name", "flags.ddbimporter.definitionId", "flags.ddbbimporter.originalName", "system.source.rules"];
  const itemIndex = await itemCompendium.getIndex({ fields: itemIndices }) as unknown as IAdventureIndexEntry[];

  const results = itemIndex
    .filter((i) => i.flags?.ddbimporter?.definitionId)
    .map((i) => {
      return {
        id: i.flags?.ddbimporter?.definitionId,
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

const ATTACK_ACTION_MAP: Record<string, { hint: string; page: string }> = {
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

export async function generateAdventureConfig({ full = false, cobalt = true, fullPageMap = false, legacy = false } = {}) {
  const getVehicles = !DDBProxy.isCustom(true) && cobalt;

  logger.info("Generating adventure config", { full, cobalt, getVehicles, fullPageMap, legacy });
  const result: IAdventureConfigResult = {
    schemaVersion: CONFIG.DDBI.schemaVersion,
    debug: false,
    observeAll: false,
    version: game.modules.get("ddb-importer")?.version as string,
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
    monstersToReplace: [],
    cobalt: null,
    campaignId: null,
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
  if (getVehicles) {
    const vehicleFactory = new DDBVehicleFactory();
    await vehicleFactory.fetchDDBVehicleSourceData();
    result.lookups.vehicles = (vehicleFactory.source ?? []).map((v) => {
      return {
        id: v.id,
        url: v.url,
        name: v.name,
        // TODO: uuid is not in the source model and is likely always undefined
        uuid: foundry.utils.getProperty(v, "uuid"),
      };
    });
  }

  if (legacy) {
    const rulesCompendium = "dnd5e.rules";
    const srdCompendium = CompendiumHelper.getCompendium(rulesCompendium);
    if (!srdCompendium) return result;

    const srdIndex = await srdCompendium.getIndex();
    const srdDocuments = await srdCompendium.getDocuments() as unknown as JournalEntry.Stored[];
    result.index = srdIndex.contents;

    const skillEntryDocument = srdDocuments.find((d) => d.name === "Chapter 7: Using Ability Scores");
    if (skillEntryDocument) {
      result.lookups.skills = CONFIG.DDB.abilitySkills.map((skill) => {
        const skillEntryPage = skillEntryDocument.pages.find((p: IAdventureJournalPage) => p.name === "Using Each Ability");
        const stat = CONFIG.DDB.stats.find((s) => s.id === skill.stat);
        const headerLink = `${stat?.name ?? ""} Checks`;
        return {
          id: skill.id,
          _id: skillEntryDocument._id,
          name: skill.name,
          compendium: rulesCompendium,
          documentName: skillEntryDocument.name,
          pageId: skillEntryPage?._id,
          headerLink,
        };
      });
    }

    const senseEntryDocument = srdDocuments.find((d) => d.name === "Appendix D: Senses and Speeds");
    if (senseEntryDocument) {
      result.lookups.senses = CONFIG.DDB.senses
        .filter((sense) => senseEntryDocument.pages.some((p: IAdventureJournalPage) => p.name === sense.name))
        .map((sense) => {
          const senseEntryPage = senseEntryDocument.pages.find((p: IAdventureJournalPage) => p.name === sense.name);
          return {
            id: sense.id,
            _id: senseEntryDocument._id,
            name: sense.name,
            compendium: rulesCompendium,
            documentName: senseEntryDocument.name,
            pageId: senseEntryPage?._id,
            headerLink: null as string | null,
          };
        });
    }

    const conditionEntryDocument = srdDocuments.find((d) => d.name === "Appendix A: Conditions");
    if (conditionEntryDocument) {
      result.lookups.conditions = CONFIG.DDB.conditions
        .filter((condition) => conditionEntryDocument.pages.some((p: IAdventureJournalPage) => p.name.trim() === condition.definition.name.trim()))
        .map((condition) => {
          const conditionEntryPage = conditionEntryDocument.pages.find((p: IAdventureJournalPage) => p.name.trim() === condition.definition.name.trim());
          return {
            id: condition.definition.id,
            _id: conditionEntryDocument.id,
            name: condition.definition.name,
            compendium: rulesCompendium,
            slug: condition.definition.slug,
            documentName: conditionEntryDocument.name,
            pageId: conditionEntryPage?._id,
            headerLink: null as string | null,
          };
        });
    }

    const actionEntryDocument = srdDocuments.find((d) => d.name === "Chapter 9: Combat");
    if (actionEntryDocument) {
      const actionEntryPage = actionEntryDocument.pages.find((p: IAdventureJournalPage) => p.name === "Actions in Combat");
      CONFIG.DDB.basicActions.forEach((action) => {
        if (ATTACK_ACTION_MAP[action.name]) {
          const attackEntryPage = actionEntryDocument.pages.find((p: IAdventureJournalPage) => p.name === ATTACK_ACTION_MAP[action.name].page);
          result.lookups.actions.push({
            id: action.id,
            _id: actionEntryDocument._id,
            name: action.name,
            compendium: rulesCompendium,
            documentName: actionEntryDocument.name,
            pageId: attackEntryPage?._id,
            headerLink: ATTACK_ACTION_MAP[action.name].hint,
          });
        } else if (action.id < 100) {
          result.lookups.actions.push({
            id: action.id,
            _id: actionEntryDocument.id,
            name: action.name,
            compendium: rulesCompendium,
            documentName: actionEntryDocument.name,
            pageId: actionEntryPage?._id,
            headerLink: action.name,
          });
        }
      });
    }

    const equipmentDocument = srdDocuments.find((d) => d.name === "Chapter 5: Equipment");
    if (equipmentDocument) {
      const weaponPropertiesPage = equipmentDocument.pages.find((p: IAdventureJournalPage) => p.name === "Weapons");
      result.lookups.weaponproperties = CONFIG.DDB.weaponProperties.map((prop) => {
        return {
          id: prop.id,
          _id: equipmentDocument._id,
          name: prop.name,
          compendium: rulesCompendium,
          documentName: equipmentDocument.name,
          pageId: weaponPropertiesPage?._id,
          headerLink: "Weapon Properties",
        };
      });
    }

    if (fullPageMap) {
      srdDocuments.forEach((document) => {
        document.pages.forEach((page: IAdventureJournalPage) => {
          result.fullPageMap.push({
            id: null,
            _id: document.id,
            name: page.name,
            compendium: rulesCompendium,
            documentName: document.name,
            pageId: page._id,
            headerLink: null as string | null,
          });
        });
      });
    }
  }

  return result;

}

export async function downloadAdventureConfig({ fullConfig = false } = {}) {
  const result = await generateAdventureConfig({ full: fullConfig });
  FileHelper.download(JSON.stringify(result, null, 4), `adventure-config.json`, "application/json");
  return result;
}
