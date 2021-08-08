// Main module class
import { checkMonsterCompendium } from "./importMonster.js";
import { munchNote, download, getPatreonTiers } from "./utils.js";
import logger from "../logger.js";
import utils from "../utils.js";
import { getCobalt } from "../lib/Secrets.js";
import { getAvailableCampaigns } from "../lib/Settings.js";
import { parseCritters } from "./monsters.js";
import { getCharacterImportSettings, getMuncherSettings, updateActorSettings, updateMuncherSettings, setRecommendedCharacterActiveEffectSettings } from "./settings.js";
import Helpers from "./adventure/common.js";
import { importCharacterById } from "../character/import.js";

const DIFFICULTY_LEVELS = [
  { id: null, name: "No challenge", color: "grey" },
  { id: 1, name: "Easy", color: "green" },
  { id: 2, name: "Medium", color: "brown" },
  { id: 3, name: "Hard", color: "orange" },
  { id: 4, name: "Deadly", color: "red" },
];

const SCENE_IMG = [
  { name: "Cobbles", img: "modules/ddb-importer/img/encounters/cobbles.webp" },
  { name: "Dungeon", img: "modules/ddb-importer/img/encounters/dungeon.png" },
  { name: "Grass", img: "modules/ddb-importer/img/encounters/grass.webp" },
  { name: "Snow", img: "modules/ddb-importer/img/encounters/snow.webp" },
  { name: "Stone", img: "modules/ddb-importer/img/encounters/stone.webp" },
  { name: "Void", img: "modules/ddb-importer/img/encounters/void.webp" },
];

async function getEncounterData() {
  const cobaltCookie = getCobalt();
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const debugJson = game.settings.get("ddb-importer", "debug-json");

  const body = {
    cobalt: cobaltCookie,
    betaKey: betaKey,
  };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/encounters`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          munchNote(`API Failure: ${data.message}`);
          reject(data.message);
        }
        if (debugJson) {
          download(JSON.stringify(data), `encounters-raw.json`, "application/json");
        }
        return data;
      })
      .then((data) => {
        munchNote(`Retrieved ${data.data.length} encounters, starting parse...`, true, false);
        logger.info(`Retrieved ${data.data.length} encounters`);
        resolve(data.data);
      })
      .catch((error) => reject(error));
  });
}

export async function parseEncounters() {
  const encounters = await getEncounterData();
  logger.debug("Fetched encounters", encounters);
  munchNote(`Fetched Available DDB Encounters`);
  CONFIG.DDBI.ENCOUNTERS = encounters;
  munchNote("");
  return CONFIG.DDBI.ENCOUNTERS;
}


async function filterEncounters(campaignId) {
  const campaigns = await getAvailableCampaigns();
  const campaignIds = campaigns.map((c) => c.id);
  const allEncounters = CONFIG.DDBI.ENCOUNTERS
     ? CONFIG.DDBI.ENCOUNTERS
     : await parseEncounters();

  logger.debug(`${allEncounters.length} encounters`, allEncounters);
  logger.debug("CampaignIds", campaignIds);
  if (!campaignId || campaignId === "" || !campaignIds.includes(parseInt(campaignId))) return allEncounters;
  logger.debug(`CampaignId to find ${campaignId}`);
  const filteredEncounters = allEncounters.filter((encounter) => encounter.campaign.id == campaignId);
  logger.debug(`${filteredEncounters.length} filtered encounters`, filteredEncounters);
  return filteredEncounters;

}


export class DDBEncounterMunch extends Application {
  constructor(options = {}) {
    super(options);
    this.encounter = {};
    this.img = "";
    this.journal = undefined;
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.baseApplication = "DDBEncounterMuncher";
    options.id = "ddb-importer-encounters";
    options.template = "modules/ddb-importer/handlebars/encounters.hbs";
    options.resizable = false;
    options.height = "auto";
    options.width = 800;
    options.title = "MrPrimate's DDB Encounter Muncher";
    options.classes = ["ddb-muncher", "sheet"];
    options.tabs = [{ navSelector: ".tabs", contentSelector: "div", initial: "settings" }];
    return options;
  }

  async parseEncounter(id) {
    logger.debug(`Looking for Encounter "${id}"`);
    if (!CONFIG.DDBI.ENCOUNTERS) return this.encounter;
    const monsterPack = await checkMonsterCompendium();

    await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });

    // console.warn(CONFIG.DDBI.ENCOUNTERS);
    const encounter = CONFIG.DDBI.ENCOUNTERS.find((e) => e.id == id.trim());
    // console.warn(encounter);

    // if (!encounter) return this.encounter;

    let goodMonsterIds = [];
    let missingMonsterIds = [];
    logger.debug("Parsing encounter", encounter);
    encounter.monsters.forEach((monster) => {
      const id = monster.id;
      const monsterInPack = monsterPack.index.find((f) => f.flags.ddbimporter.id == id);
      if (monsterInPack) {
        goodMonsterIds.push({ ddbId: id, name: monsterInPack.name, id: monsterInPack._id, quantity: monster.quantity });
      } else {
        missingMonsterIds.push({ ddbId: id, quantity: monster.quantity });
      }
    });

    let goodCharacterData = [];
    let missingCharacterData = [];
    encounter.players
    .filter((character) => !character.hidden)
    .forEach((character) => {
      const characterInGame = game.actors.find((actor) => actor.data.flags?.ddbimporter?.dndbeyond?.characterId && actor.data.flags.ddbimporter.dndbeyond.characterId == character.id);
      if (characterInGame) {
        goodCharacterData.push({ id: characterInGame.id, name: characterInGame.name, ddbId: character.id });
      } else {
        missingCharacterData.push({ ddbId: character.id, name: character.name });
      }
    });

    const difficulty = DIFFICULTY_LEVELS.find((level) => level.id == encounter.difficulty);

    this.encounter = {
      id,
      name: encounter.name,
      difficulty,
      description: encounter.description,
      rewards: encounter.rewards,
      summary: encounter.flavorText,
      campaign: encounter.campaign,
      monsters: encounter.monsters,
      characters: encounter.players,
      goodMonsterIds,
      missingMonsterIds,
      goodCharacterData,
      missingCharacterData,
      missingMonsters: missingMonsterIds.length !== 0,
      missingCharacters: missingCharacterData.length !== 0,
    };

    logger.debug("Current encounter", this.encounter);

    return this.encounter;

  }

  resetEncounter(html) {
    const nameHtml = html.find("#ddb-encounter-name");
    const summaryHtml = html.find("#ddb-encounter-summary");
    const charactersHtml = html.find("#ddb-encounter-characters");
    const monstersHtml = html.find("#ddb-encounter-monsters");
    const difficultyHtml = html.find("#ddb-encounter-difficulty");
    const rewardsHtml = html.find("#ddb-encounter-rewards");

    nameHtml[0].innerHTML = `<p id="ddb-encounter-name"><i class='fas fa-question'></i> <b>Encounter:</b></p>`;
    summaryHtml[0].innerHTML = `<p id="ddb-encounter-summary"><i class='fas fa-question'></i> <b>Summary:</b></p>`;
    charactersHtml[0].innerHTML = `<p id="ddb-encounter-characters"><i class='fas fa-question'></i> <b>Characters:</b></p>`;
    monstersHtml[0].innerHTML = `<p id="ddb-encounter-monsters"><i class='fas fa-question'></i> <b>Monsters:</b></p>`;
    difficultyHtml[0].innerHTML = `<p id="ddb-encounter-difficulty"><i class='fas fa-question'></i> <b>Difficulty:</b></p>`;
    rewardsHtml[0].innerHTML = `<p id="ddb-encounter-rewards"><i class='fas fa-question'></i> <b>Rewards:</b></p>`;

    $('#ddb-importer-encounters').css("height", "auto");
    $('#encounter-button').prop("disabled", true);
    $('#encounter-button').prop("innerText", "Import Encounter");
    this.encounter = {};
    this.journal = undefined;
    this.combat = undefined;
  }

  async importMonsters() {
    const importMonsters = game.settings.get("ddb-importer", "encounter-import-policy-missing-monsters");

    if (importMonsters && this.encounter.missingMonsters && this.encounter.missingMonsterIds.length > 0) {
      logger.debug("Importing missing monsters from DDB");
      await parseCritters(this.encounter.missingMonsterIds.map((monster) => monster.ddbId));
      console.warn("Finised Importing missing monsters from DDB");
    }

    const monsterPack = await checkMonsterCompendium();
    await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });
    const compendiumName = await game.settings.get("ddb-importer", "entity-monster-compendium");

    let monstersToAddToWorld = [];
    this.encounter.monsterData = [];
    this.encounter.worldMonsters = [];
    this.encounter.monsters.forEach((monster) => {
      const id = monster.id;
      const monsterInPack = monsterPack.index.find((f) => f.flags?.ddbimporter?.id == id);
      if (monsterInPack) {
        for (let i = 0; i < monster.quantity; i++) {
          const monsterData = {
            ddbId: id,
            name: monsterInPack.name,
            id: monsterInPack._id,
            quantity: 1,
            journalLink: `@Compendium[${compendiumName}.${monsterInPack.name}]{${monsterInPack.name}}`,
          };
          this.encounter.monsterData.push(monsterData);
          monstersToAddToWorld.push(monsterData);
        }
      }
    });

    const encounterMonsterFolder = await utils.getFolder("npc", this.encounter.name, "D&D Beyond Encounters", "#6f0006", "#98020a", false);

    logger.debug("Trying to import monsters from compendium", monstersToAddToWorld);
    await Helpers.asyncForEach(monstersToAddToWorld, async (actor) => {
      let worldActor = game.actors.find((a) => a.data.folder == encounterMonsterFolder.id && a.data.flags?.ddbimporter?.id == actor.ddbId);
      if (!worldActor) {
        logger.info(`Importing monster ${actor.name} with DDB ID ${actor.ddbId} from ${monsterPack.metadata.name} with id ${actor.id}`);
        try {
          worldActor = await game.actors.importFromCompendium(monsterPack, actor.id, { folder: encounterMonsterFolder.id });
          console.error(worldActor);
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to import actor ${actor.name} with id ${actor.id} from DDB Compendium`);
          logger.debug(`Failed on: game.actors.importFromCompendium(monsterCompendium, "${actor.id}", { folder: "${encounterMonsterFolder.id}" });`);
        }
      }
      this.encounter.worldMonsters.push({ id: worldActor.id, name: worldActor.name, quantity: actor.quantity });
    });

    return new Promise((resolve) => {
      resolve(true);
    });

  }

  async importCharacters(html) {
    const importCharacters = game.settings.get("ddb-importer", "encounter-import-policy-missing-characters");
    if (importCharacters && this.encounter.missingCharacters) {
      await Helpers.asyncForEach(this.encounter.missingCharacterData, async (character) => {
        await importCharacterById(html, character.ddbId);
      });
    }
  }

  async createJournalEntry() {
    logger.debug(`Creating journal entry`);
    const journal = {
      name: this.encounter.name,
      flags: {
        ddbimporter: {
         encounterId: this.encounter.id,
        },
      },
    };

    const importJournal = game.settings.get("ddb-importer", "encounter-import-policy-create-journal");
    if (importJournal) {
      const journalFolder = await utils.getFolder("journal", this.encounter.name, "D&D Beyond Encounters", "#6f0006", "#98020a", false);
      journal.folder = journalFolder.id;
      journal.content = `<h1>${this.encounter.name}</h1>`;
      if (this.encounter.summary && this.encounter.summary != "") {
        journal.content += `<h2>Summary</h2>${this.encounter.summary}`;
      }
      if (this.encounter.monsterData && this.encounter.monsterData.length > 0) {
        journal.content += `<h2>Monsters</h2><ul>`;
        this.encounter.monsterData.forEach((monster) => {
          journal.content += `<li><p>${monster.journalLink} x${monster.quantity}</p></li>`;
        });
        journal.content += `</ul>`;
      }
      if (this.encounter.difficulty && this.encounter.difficulty != "") {
        journal.content += `<h2>Difficulty: <span style="color: ${this.encounter.difficulty.color}">${this.encounter.difficulty.name}</span></h3>`;
      }
      if (this.encounter.description && this.encounter.description != "") {
        journal.content += `<h2>Description</h2>${this.encounter.description}`;
      }
      if (this.encounter.rewards && this.encounter.rewards != "") {
        journal.content += `<h2>Rewards</h2>${this.encounter.rewards}`;
      }

      let worldJournal = game.journal.find((a) => a.data.folder == journalFolder.id && a.data.flags?.ddbimporter?.encounterId == this.encounter.id);
      if (!worldJournal) {
        logger.info(`Importing journal ${journal.name}`);
        try {
          worldJournal = await JournalEntry.create(journal);
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to create journal ${journal.name}`);
        }
      } else {
        logger.info(`Updating journal ${journal.name}`);
        journal._id = worldJournal.id;
        await worldJournal.update(journal);
      }
      this.journal = worldJournal;
    }
    return journal;

  }

  async createScene() {
    let sceneData = {
      name: this.encounter.name,
      flags: {
        ddbimporter: {
         encounterId: this.encounter.id,
        },
      },
      width: 1000,
      height: 1000,
      grid: 100,
      padding: 0.25,
      initial: {
        x: 500,
        y: 500,
        scale: 0.57
      },
      tokens: [],
      img: this.img,
      tokenVision: false,
      fogExploration: false,
    };

    const importScene = game.settings.get("ddb-importer", "encounter-import-policy-create-scene");
    if (importScene) {
      logger.debug(`Creating scene for encounter ${this.encounter.name}`);
      const xSquares = sceneData.width / sceneData.grid;
      const ySquares = sceneData.height / sceneData.grid;
      const xStartPixelMonster = (sceneData.width * sceneData.padding) + (sceneData.grid / 2);
      const xStartPixelPC = xStartPixelMonster + (sceneData.grid * (xSquares - 1));
      const yStartPixel = (sceneData.height * sceneData.padding) + (sceneData.grid / 2);
      let characterCount = 0;
      this.encounter.characters
        .filter((character) => !character.hidden)
        .forEach(async (character) => {
          const characterInGame = game.actors.find((actor) => actor.data.flags?.ddbimporter?.dndbeyond?.characterId && actor.data.flags.ddbimporter.dndbeyond.characterId == character.id);
          if (characterInGame) {
            const linkedToken = JSON.parse(JSON.stringify(await characterInGame.getTokenData()));
            linkedToken.x = xStartPixelPC;
            linkedToken.y = yStartPixel + (characterCount * sceneData.grid);
            sceneData.tokens.push(linkedToken);
            characterCount++;
          }
        });

      let monsterDepth = 0;
      let monsterRows = 0;
      let rowMonsterWidth = 1;
      this.encounter.worldMonsters
        .forEach(async (worldMonster) => {
          logger.info(`Adding ${worldMonster.name} for ${this.encounter.name}`);
          const monster = game.actors.get(worldMonster.id);
          const linkedToken = JSON.parse(JSON.stringify(await monster.getTokenData()));
          if (monsterDepth + linkedToken.height > ySquares) {
            monsterDepth = 0;
            monsterRows += rowMonsterWidth;
            rowMonsterWidth = 1;
          }
          linkedToken.x = xStartPixelMonster + (sceneData.grid * (monsterRows));
          linkedToken.y = yStartPixel + (monsterDepth * sceneData.grid);
          sceneData.tokens.push(linkedToken);
          monsterDepth += linkedToken.height;
          if (linkedToken.width > rowMonsterWidth) rowMonsterWidth = linkedToken.width;
        });

      if (this.journal?.id) sceneData.journal = this.journal.id;

      const sceneFolder = await utils.getFolder("scene", this.encounter.name, "D&D Beyond Encounters", "#6f0006", "#98020a", false);
      // eslint-disable-next-line require-atomic-updates
      sceneData.folder = sceneFolder.id;

      let worldScene = game.scenes.find((a) => a.data.folder == sceneFolder.id && a.data.flags?.ddbimporter?.encounterId == this.encounter.id);
      if (!worldScene) {

        logger.info(`Importing scene ${sceneData.name}`);
        try {
          worldScene = await Scene.create(sceneData);
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to create scene ${sceneData.name}`);
        }
      } else {
        logger.info(`Updating scene ${sceneData.name}`);
        sceneData._id = worldScene.id;
        await Scene.deleteDocuments([worldScene.id]);
        try {
          worldScene = await Scene.create(sceneData, { keepId: true });
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to create scene ${sceneData.name}`);
        }
      }

      const thumbData = await worldScene.createThumbnail();
      // eslint-disable-next-line require-atomic-updates
      sceneData["thumb"] = thumbData.thumb;

      await worldScene.update(sceneData);
      await worldScene.view();
      this.scene = worldScene;
    }
    return sceneData;
  }

  async createCombatEncounter() {
    const importCombat = game.settings.get("ddb-importer", "encounter-import-policy-create-scene");

    if (!importCombat) return undefined;
    logger.debug(`Creating combat for encounter ${this.encounter.name}`);
    const combat = await Combat.create({ scene: this.scene.id });

    this.scene.tokens.forEach((token) => {
      combat.createEmbeddedDocuments("Combatant", [{
        tokenId: token.id,
        hidden: token.data.hidden,
      }]);
    });

    await combat.activate();

    this.combat = combat;
    return combat;
  }

  activateListeners(html) {
    super.activateListeners(html);

    $(html)
      .find(
        [
          '.munching-generic-config input[type="checkbox"]',
          '.munching-monster-config input[type="checkbox"]',
        ].join(",")
      )
      .on("change", (event) => {
        updateMuncherSettings(html, event);
      });

    $(html)
      .find(
        [
          '.import-policy input[type="checkbox"]',
          '.advanced-import-config input[type="checkbox"]',
          '.effect-policy input[type="checkbox"]',
          '.effect-import-config input[type="checkbox"]',
          '.extras-import-config input[type="checkbox"]',
          '.import-config input[type="checkbox"]',
        ].join(",")
      )
      .on("change", (event) => {
        updateActorSettings(html, event);

      });

    $(html)
      .find("#default-effects")
      .on("click", async (event) => {
        event.preventDefault();
        setRecommendedCharacterActiveEffectSettings(html);

      });

    $(html)
      .find('.sync-policy input[type="checkbox"]')
      .on("change", (event) => {
        game.settings.set(
          "ddb-importer",
          "sync-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked
        );
      });


    $(html)
      .find('.encounter-config input[type="checkbox"]')
      .on("change", (event) => {
        game.settings.set(
          "ddb-importer",
          "encounter-import-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked
        );
      });

    // img change
    html.find("#encounter-scene-img-select").on("change", async () => {
      const imgSelect = html.find("#encounter-scene-img-select");
      this.img = imgSelect[0].selectedOptions[0]
        ? imgSelect[0].selectedOptions[0].value
        : "";
    });

    // filter campaigns
    html.find("#encounter-campaign-select").on("change", async () => {
      const campaignSelection = html.find("#encounter-campaign-select");
      // get selected campaign from html selection
      const campaignId = campaignSelection[0].selectedOptions[0]
        ? campaignSelection[0].selectedOptions[0].value
        : undefined;
      const encounters = await filterEncounters(campaignId);
      const campaignSelected = campaignId && campaignId !== "";
      let encounterList = `<option value="">Select encounter:</option>`;
      encounters.forEach((encounter) => {
        encounterList += `<option value="${encounter.id}">${encounter.name}${campaignSelected ? "" : ` (${encounter.campaign.name})`}</option>\n`;
      });
      const list = html.find("#encounter-select");
      list[0].innerHTML = encounterList;
      this.resetEncounter(html);
    });

    // encounter change
    html.find('#encounter-select').on("change", async () => {
      this.resetEncounter(html);
      const encounterSelection = html.find("#encounter-select");
      const encounterId = encounterSelection[0].selectedOptions[0]
        ? encounterSelection[0].selectedOptions[0].value
        : undefined;

      const encounter = await this.parseEncounter(encounterId);
      // console.warn(encounter);

      const nameHtml = html.find("#ddb-encounter-name");
      const summaryHtml = html.find("#ddb-encounter-summary");
      const charactersHtml = html.find("#ddb-encounter-characters");
      const monstersHtml = html.find("#ddb-encounter-monsters");
      const difficultyHtml = html.find("#ddb-encounter-difficulty");
      const rewardsHtml = html.find("#ddb-encounter-rewards");

      const missingCharacters = encounter.missingCharacters ? `fa-times-circle' style='color: red` : `fa-check-circle' style='color: green`;
      const missingMonsters = encounter.missingMonsters ? `fa-times-circle' style='color: red` : `fa-check-circle' style='color: green`;

      const goodCharacters = encounter.goodCharacterData.map((character) => `${character.name}`).join(", ");
      const goodMonsters = encounter.goodMonsterIds.map((monster) => `${monster.name}`).join(", ");
      const neededCharactersHTML = encounter.missingCharacters
        ? ` <span style="color: red"> Missing ${encounter.missingCharacterData.length}: ${encounter.missingCharacterData.map((character) => character.name).join(", ")}</span>`
        : "";
      const neededMonstersHTML = encounter.missingMonsters
        ? ` <span style="color: red"> Missing ${encounter.missingMonsterIds.length}. DDB Id's: ${encounter.missingMonsterIds.map((monster) => monster.ddbId).join(", ")}</span>`
        : "";

      nameHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Encounter:</b> ${encounter.name}`;
      if (encounter.summary && encounter.summary.trim() !== "") summaryHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Summary:</b> ${encounter.summary}`;
      if (encounter.goodCharacterData.length > 0 || encounter.missingCharacterData.length > 0) {
        charactersHtml[0].innerHTML = `<i class='fas ${missingCharacters}'></i> <b>Characters:</b> ${goodCharacters}${neededCharactersHTML}`;
      }
      if (encounter.goodMonsterIds.length > 0 || encounter.missingMonsterIds.length > 0) {
        monstersHtml[0].innerHTML = `<i class='fas ${missingMonsters}'></i> <b>Monsters:</b> ${goodMonsters}${neededMonstersHTML}`;
      }
      difficultyHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Difficulty:</b> <span style="color: ${encounter.difficulty.color}">${encounter.difficulty.name}</span>`;
      if (encounter.rewards && encounter.rewards.trim() !== "") rewardsHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Rewards:</b> ${encounter.rewards}`;

      $('#ddb-importer-encounters').css("height", "auto");
      $('#encounter-button').prop("disabled", false);
    });

    // import encounter
    html.find("#encounter-button").click(async (event) => {
      event.preventDefault();
      $('#encounter-button').prop("disabled", true);
      $('#encounter-button').prop("innerText", "Munching...");


      await this.importMonsters();
      await this.importCharacters(html);
      await this.createJournalEntry();
      await this.createScene();
      await this.createCombatEncounter();

      // to do:
      // adjust monsters hp?
      // add initiative if combat in progress?
      // - extra import?
      // - attempt to find magic items and add them to the world?

      $('#encounter-button').prop("innerText", "Encounter Munched");
      const campaignFluff = this.encounter.campaign?.name && this.encounter.campaign.name.trim() !== ""
        ? ` of ${this.encounter.name}`
        : "";
      ui.notifications.warn(`Prepare to battle heroes${campaignFluff}, your doom awaits in ${this.encounter.name}!`);
    });

  }

  // eslint-disable-next-line class-methods-use-this
  async getData() {
    const tier = game.settings.get("ddb-importer", "patreon-tier");
    const tiers = getPatreonTiers(tier);
    const availableCampaigns = await getAvailableCampaigns();
    const availableEncounters = await filterEncounters();

    const characterSettings = getCharacterImportSettings();
    const muncherSettings = getMuncherSettings(false);

    const importSettings = mergeObject(characterSettings, muncherSettings);

    const encounterConfig = [
      {
        name: "missing-characters",
        isChecked: game.settings.get("ddb-importer", "encounter-import-policy-missing-characters"),
        description: "Import missing characters?",
      },
      {
        name: "missing-monsters",
        isChecked: game.settings.get("ddb-importer", "encounter-import-policy-missing-monsters"),
        description: "Import missing monsters?",
      },
      {
        name: "create-journal",
        isChecked: game.settings.get("ddb-importer", "encounter-import-policy-create-journal"),
        description: "Create encounter journal entry?",
      },
      {
        name: "create-scene",
        isChecked: game.settings.get("ddb-importer", "encounter-import-policy-create-scene"),
        description: "Create/update a scene to use, and add available characters and NPC's?",
      },
    ];

    const encounterSettings = {
      tiers,
      availableCampaigns,
      availableEncounters,
      encounterConfig,
      sceneImg: SCENE_IMG,
    };

    const data = mergeObject(importSettings, encounterSettings);
    logger.debug("Encounter muncher form data", data);

    return data;
  }
}
