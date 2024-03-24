import logger from "../logger.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import MuncherSettings from "../lib/MuncherSettings.js";
import DDBCampaigns from "../lib/DDBCampaigns.js";
import { importCharacterById } from "./DDBCharacterManager.js";
import SETTINGS from "../settings.js";
import DDBEncounters from "../parser/DDBEncounters.js";
import DDBMonsterFactory from "../parser/DDBMonsterFactory.js";
import FolderHelper from "../lib/FolderHelper.js";
import utils from "../lib/utils.js";

export default class DDBEncounterMunch extends Application {

  constructor(options = {}) {
    super(options);
    this.encounter = {};
    this.img = "";
    this.sceneId = "";
    this.journal = undefined;
    this.combat = undefined;
    this.tokens = [];
    this.folders = {};
    this.ddbEncounters = new DDBEncounters();
  }

  static SCENE_IMG = [
    { name: "Bar", img: "modules/ddb-importer/img/encounters/bar.webp" },
    { name: "Cobbles", img: "modules/ddb-importer/img/encounters/cobbles.webp" },
    { name: "Dungeon", img: "modules/ddb-importer/img/encounters/dungeon.png" },
    { name: "Grass", img: "modules/ddb-importer/img/encounters/grass.webp" },
    { name: "Snow", img: "modules/ddb-importer/img/encounters/snow.webp" },
    { name: "Stone", img: "modules/ddb-importer/img/encounters/stone.webp" },
    { name: "Void", img: "modules/ddb-importer/img/encounters/void.webp" },
  ];

  /**
   * Display information when Munching
   * @param {*} note
   * @param {*} nameField
   * @param {*} monsterNote
   */
  static munchNote(note, nameField = false, monsterNote = false) {
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
    if (this.ddbEncounters.encounters.length === 0) return this.encounter;
    const monsterPack = CompendiumHelper.getCompendiumType("monster", false);
    await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });

    const encounter = this.ddbEncounters.encounters.find((e) => e.id == id.trim());

    let goodMonsterIds = [];
    let missingMonsterIds = [];
    logger.debug("Parsing encounter", encounter);
    encounter.monsters.forEach((monster) => {
      const id = monster.id;
      const monsterInPack = monsterPack.index.find((f) => f.flags?.ddbimporter?.id == id);
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
        const characterInGame = game.actors.find(
          (actor) =>
            actor.flags?.ddbimporter?.dndbeyond?.characterId
            && actor.flags.ddbimporter.dndbeyond.characterId == character.id
        );
        if (characterInGame) {
          goodCharacterData.push({ id: characterInGame.id, name: characterInGame.name, ddbId: character.id });
        } else {
          missingCharacterData.push({ ddbId: character.id, name: character.name });
        }
      });

    const difficulty = DDBEncounters.DIFFICULTY_LEVELS.find((level) => level.id == encounter.difficulty);

    this.encounter = {
      id,
      name: encounter.name,
      inProgress: encounter.inProgress,
      turnNum: encounter.turnNum,
      roundNum: encounter.roundNum,
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

    this.folders = {};

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
    const progressHtml = html.find("#ddb-encounter-progress");

    nameHtml[0].innerHTML = `<p id="ddb-encounter-name"><i class='fas fa-question'></i> <b>Encounter:</b></p>`;
    summaryHtml[0].innerHTML = `<p id="ddb-encounter-summary"><i class='fas fa-question'></i> <b>Summary:</b></p>`;
    charactersHtml[0].innerHTML = `<p id="ddb-encounter-characters"><i class='fas fa-question'></i> <b>Characters:</b></p>`;
    monstersHtml[0].innerHTML = `<p id="ddb-encounter-monsters"><i class='fas fa-question'></i> <b>Monsters:</b></p>`;
    difficultyHtml[0].innerHTML = `<p id="ddb-encounter-difficulty"><i class='fas fa-question'></i> <b>Difficulty:</b></p>`;
    rewardsHtml[0].innerHTML = `<p id="ddb-encounter-rewards"><i class='fas fa-question'></i> <b>Rewards:</b></p>`;
    progressHtml[0].innerHTML = `<p id="ddb-encounter-progress"><i class='fas fa-question'></i> <b>In Progress:</b></p>`;

    $("#ddb-importer-encounters").css("height", "auto");
    $("#encounter-button").prop("disabled", true);
    $("#encounter-button").prop("innerText", "Import Encounter");
    $("#encounter-import-policy-use-ddb-save").prop("disabled", true);
    this.encounter = {};
    this.journal = undefined;
    this.combat = undefined;
    this.tokens = [];
  }

  async importMonsters() {
    const importMonsters = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-monsters");

    if (importMonsters && this.encounter.missingMonsters && this.encounter.missingMonsterIds.length > 0) {
      logger.debug("Importing missing monsters from DDB");
      const monsterFactory = new DDBMonsterFactory({ munchNote: DDBEncounterMunch.munchNote });
      await monsterFactory.processIntoCompendium(this.encounter.missingMonsterIds.map((monster) => monster.ddbId));
      logger.debug("Finised Importing missing monsters from DDB");
    }

    const monsterPack = CompendiumHelper.getCompendiumType("monster", false);
    await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });
    const compendiumName = CompendiumHelper.getCompendiumLabel("monster");

    let monstersToAddToWorld = [];
    this.encounter.monsterData = [];
    this.encounter.worldMonsters = [];
    let journalMonsterInfo = new Map();
    this.encounter.monsters.forEach((monster) => {
      const id = monster.id;
      const monsterInPack = monsterPack.index.find((f) => f.flags?.ddbimporter?.id == id);
      if (monsterInPack) {
        let monsterData = {
          ddbId: id,
          name: monsterInPack.name,
          id: monsterInPack._id,
          quantity: monster.quantity,
          journalLink: `@Compendium[${compendiumName}.${monsterInPack._id}]{${monsterInPack.name}}`,
        };
        if (journalMonsterInfo.has(monsterData.ddbId)) {
          monsterData = journalMonsterInfo.get(monsterData.ddbId);
          monsterData.quantity += monster.quantity;
        }
        journalMonsterInfo.set(monsterData.ddbId, monsterData);

        for (let i = 0; i < monster.quantity; i++) {
          let addData = foundry.utils.deepClone(monsterData);
          addData.quantity = 1;
          addData.uniqueId = monster.uniqueId;
          addData.initiative = monster.initiative;
          addData.currentHitPoints = monster.currentHitPoints;
          addData.maximumHitPoints = monster.maximumHitPoints;
          addData.temporaryHitPoints = monster.temporaryHitPoints;
          addData.ddbName = monster.name ? monster.name : monsterInPack.name;
          monstersToAddToWorld.push(addData);
        }
      }
    });
    this.encounter.monsterData = Object.values(journalMonsterInfo);

    const encounterMonsterFolder = await FolderHelper.getFolder(
      "npc",
      this.encounter.name,
      "D&D Beyond Encounters",
      "#6f0006",
      "#98020a",
      false
    );

    logger.debug("Trying to import monsters from compendium", monstersToAddToWorld);
    await utils.asyncForEach(monstersToAddToWorld, async (actor) => {
      let worldActor = game.actors.find(
        (a) => a.folder?.id == encounterMonsterFolder.id && a.flags?.ddbimporter?.id == actor.ddbId
      );
      if (!worldActor) {
        logger.info(
          `Importing monster ${actor.name} with DDB ID ${actor.ddbId} from ${monsterPack.metadata.name} with id ${actor.id}`
        );
        try {
          worldActor = await game.actors.importFromCompendium(monsterPack, actor.id, {
            folder: encounterMonsterFolder.id,
          });
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to import actor ${actor.name} with id ${actor.id} from DDB Compendium`);
          logger.debug(
            `Failed on: game.actors.importFromCompendium(monsterCompendium, "${actor.id}", { folder: "${encounterMonsterFolder.id}" });`
          );
        }
      }
      this.encounter.worldMonsters.push(foundry.utils.mergeObject(actor, { id: worldActor.id }));
    });

    return new Promise((resolve) => {
      resolve(this.encounter.worldMonsters);
    });
  }

  async importCharacters(html) {
    const importCharacters = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-characters");
    if (importCharacters && this.encounter.missingCharacters) {
      await utils.asyncForEach(this.encounter.missingCharacterData, async (character) => {
        await importCharacterById(character.ddbId, html);
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

    const importJournal = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-journal");
    if (importJournal) {
      const journalFolder = await FolderHelper.getFolder(
        "journal",
        this.encounter.name,
        "D&D Beyond Encounters",
        "#6f0006",
        "#98020a",
        false
      );
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

      let worldJournal = game.journal.find(
        (a) => a.folder == journalFolder.id && a.flags?.ddbimporter?.encounterId == this.encounter.id
      );
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

    return new Promise((resolve) => {
      resolve(journal);
    });
  }


  async createNewScene() {
    this.folders["scene"] = await FolderHelper.getFolder(
      "scene",
      this.encounter.name,
      "D&D Beyond Encounters",
      "#6f0006",
      "#98020a",
      false
    );

    let sceneData = {
      name: this.encounter.name,
      flags: {
        ddbimporter: {
          encounterId: this.encounter.id,
          encounters: true,
        },
      },
      width: 1000,
      height: 1000,
      grid: {
        type: 1,
        size: 100,
        distance: 5,
        units: "ft",
      },
      padding: 0.25,
      initial: {
        x: 500,
        y: 500,
        scale: 0.57,
      },
      img: this.img,
      tokenVision: false,
      fogExploration: false,
      folder: this.folders["scene"].id,
    };

    return sceneData;

  }

  // eslint-disable-next-line complexity
  async createScene() {
    const importDDBIScene = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene");
    const useExistingScene = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene");

    if (!importDDBIScene && !useExistingScene) return undefined;

    let sceneData;
    let worldScene;

    if (importDDBIScene) {
      logger.debug(`Creating scene for encounter "${this.encounter.name}""`);
      sceneData = await this.createNewScene();
    } else if (useExistingScene) {
      worldScene = game.scenes.find((s) => s.id == this.sceneId);
      if (worldScene) {
        sceneData = worldScene.toObject();
        logger.debug(`Using existing scene "${worldScene.name}" for encounter "${this.encounter.name}""`, { worldScene, sceneData });
      } else {
        logger.warn(`Unable to find scene ${this.sceneId}, creating a new scene `);
        throw new Error(`Unable to find scene ${this.sceneId}, creating a new scene `);
      }
      this.scene = worldScene;
    }

    if (sceneData) {
      let tokenData = [];
      const useDDBSave
        = this.encounter.inProgress && game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-use-ddb-save");
      const xSquares = sceneData.width / sceneData.grid.size;
      const ySquares = sceneData.height / sceneData.grid.size;
      const midSquareOffset = sceneData.grid.size / 2;
      const widthPaddingOffset = sceneData.width * sceneData.padding;
      const heightPaddingOffset = sceneData.height * sceneData.padding;
      const xPCOffset = sceneData.grid.size * (xSquares - 1);
      const xStartPixelMonster = widthPaddingOffset + midSquareOffset;
      const xStartPixelPC = xStartPixelMonster + xPCOffset;
      const yStartPixel = heightPaddingOffset + midSquareOffset;
      let characterCount = 0;
      this.encounter.characters
        .filter((character) => !character.hidden)
        .forEach(async (character) => {
          logger.info(`Generating token ${character.name} for ${this.encounter.name}`);
          const characterInGame = game.actors.find(
            (actor) =>
              actor.flags?.ddbimporter?.dndbeyond?.characterId
              && actor.flags.ddbimporter.dndbeyond.characterId == character.id
          );
          if (characterInGame) {
            const onScene = useExistingScene && worldScene.tokens
              .some((t) => t.actor.flags?.ddbimporter?.id == character.id && t.actor.type == "character");

            if (!onScene) {
              const linkedToken = foundry.utils.duplicate(await characterInGame.getTokenDocument());
              if (useDDBSave) {
                foundry.utils.setProperty(linkedToken, "flags.ddbimporter.dndbeyond.initiative", character.initiative);
              }
              foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounters`, true);
              foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounterId`, this.encounter.id);
              linkedToken.x = xStartPixelPC;
              const yOffsetChange = characterCount * sceneData.grid.size;
              linkedToken.y = yStartPixel + yOffsetChange;
              tokenData.push(linkedToken);
              characterCount++;
            }
          }
        });

      let monsterDepth = 0;
      let monsterRows = 0;
      let rowMonsterWidth = 1;
      for (const worldMonster of this.encounter.worldMonsters) {
        logger.info(`Generating token ${worldMonster.ddbName} (${worldMonster.name}) for ${this.encounter.name}`);
        const monster = game.actors.get(worldMonster.id);
        // eslint-disable-next-line no-await-in-loop
        const linkedToken = foundry.utils.duplicate(await monster.getTokenDocument());
        if (monsterDepth + linkedToken.height > ySquares) {
          monsterDepth = 0;
          monsterRows += rowMonsterWidth;
          rowMonsterWidth = 1;
        }

        foundry.utils.setProperty(linkedToken, "name", worldMonster.ddbName);
        foundry.utils.setProperty(linkedToken, `delta.name`, worldMonster.ddbName);
        foundry.utils.setProperty(linkedToken, "flags.ddbimporter.dndbeyond.uniqueId", worldMonster.uniqueId);
        foundry.utils.setProperty(linkedToken, "flags.ddbimporter.encounterId", this.encounter.id);
        foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.dndbeyond.uniqueId`, worldMonster.uniqueId);
        foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounters`, true);
        foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounterId`, this.encounter.id);
        const xOffsetChange = sceneData.grid.size * monsterRows;
        const yOffsetChange = monsterDepth * sceneData.grid.size;
        linkedToken.x = xStartPixelMonster + xOffsetChange;
        linkedToken.y = yStartPixel + yOffsetChange;
        if (useDDBSave) {
          foundry.utils.setProperty(linkedToken, "flags.ddbimporter.dndbeyond.initiative", worldMonster.initiative);
          // if no hp changes have been made on a monster on ddb it says 0 here
          if (worldMonster.maximumHitPoints !== 0) {
            foundry.utils.setProperty(linkedToken, `delta.system.attributes.hp.max`, worldMonster.maximumHitPoints);
            foundry.utils.setProperty(
              linkedToken,
              `delta.system.attributes.hp.value`,
              worldMonster.currentHitPoints + worldMonster.temporaryHitPoints
            );
          }
        }

        tokenData.push(linkedToken);
        monsterDepth += linkedToken.height;
        if (linkedToken.width > rowMonsterWidth) rowMonsterWidth = linkedToken.width;
      }

      if (this.journal?.id) sceneData.journal = this.journal.id;

      if (importDDBIScene) {
        worldScene = game.scenes.find(
          (a) => a.folder == this.folders["scene"].id
          && a.flags?.ddbimporter?.encounterId == this.encounter.id
        );
      }

      if (worldScene) {
        logger.info(`Updating scene ${sceneData.name}`);
        const existingCombats = game.combats.filter((c) =>
          c.scene?.id == worldScene.id
          && c.flags?.ddbimporter?.encounterId == this.encounter.id
        );
        await Combat.deleteDocuments(existingCombats.map((c) => c.id));
        if (importDDBIScene) {
          logger.info(`Updating DDBI scene ${sceneData.name}`);
          sceneData._id = worldScene.id;
          await worldScene.deleteEmbeddedDocuments("Token", [], { deleteAll: true });
          await worldScene.update(foundry.utils.mergeObject(worldScene.toObject(), sceneData));
        } else if (useExistingScene) {
          logger.info(`Checking existing scene ${sceneData.name} for encounter monsters`);
          const existingSceneMonsterIds = worldScene.tokens
            .filter((t) => t.flags?.ddbimporter?.encounterId == this.encounter.id && t.actor.type == "npc")
            .map((t) => t.id);
          await worldScene.deleteEmbeddedDocuments("Token", existingSceneMonsterIds);
        }
      } else if (importDDBIScene) {
        logger.info(`Importing scene ${sceneData.name}`);
        try {
          // eslint-disable-next-line require-atomic-updates
          worldScene = await Scene.create(sceneData);
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to create scene ${sceneData.name}`);
        }
      }

      const thumbData = await worldScene.createThumbnail();
      const thumbScene = worldScene.toObject();
      thumbScene["thumb"] = thumbData.thumb;

      logger.debug("Creating tokenens on scene", tokenData);
      // eslint-disable-next-line require-atomic-updates
      worldScene = await worldScene.update(thumbScene, { keepId: true });

      await worldScene.createEmbeddedDocuments("Token", tokenData);

      this.scene = worldScene;
    }
    logger.debug("Scene created", this.scene);

    this.scene.render();

    return this.scene;
  }

  async createCombatEncounter() {
    const importCombat = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene")
      || game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene");

    if (!importCombat) return undefined;
    logger.debug(`Creating combat for encounter ${this.encounter.name}`);

    const useDDBSave
      = this.encounter.inProgress && game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-use-ddb-save");

    await this.scene.view();
    const flags = {
      "ddbimporter.encounterId": this.encounter.id,
    };
    this.combat = await Combat.create({ scene: this.scene.id, flags: flags });
    await this.combat.activate();

    let toCreate = [];
    const tokens = canvas.tokens.placeables
      .filter((t) => t.document.flags?.ddbimporter?.encounterId == this.encounter.id || t.actor.type == "character");
    if (tokens.length) {
      tokens.forEach((t) => {
        let combatant = { tokenId: t.id, actorId: t.document.actorId, hidden: t.document.hidden };
        if (useDDBSave && t.document.flags.ddbimporter?.dndbeyond?.initiative)
          combatant.initiative = t.document.flags.ddbimporter.dndbeyond.initiative;
        if (!t.inCombat) toCreate.push(combatant);
      });
      const combatants = await this.combat.createEmbeddedDocuments("Combatant", toCreate);

      const rollMonsterInitiative = game.settings.get(
        "ddb-importer",
        "encounter-import-policy-roll-monster-initiative"
      );
      combatants
        .filter((c) => rollMonsterInitiative && c.actor.type === "npc" && c.initiative === null)
        .forEach(async (c) => {
          if (c.initiative === null) await this.combat.rollInitiative(c.id);
        });
    }

    return this.combat;
  }

  activateListeners(html) {
    super.activateListeners(html);

    $(html)
      .find(
        ['.munching-generic-config input[type="checkbox"]', '.munching-monster-config input[type="checkbox"]'].join(",")
      )
      .on("change", (event) => {
        MuncherSettings.updateMuncherSettings(html, event);
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
        MuncherSettings.updateActorSettings(html, event);
      });

    $(html)
      .find("#default-effects")
      .on("click", async (event) => {
        event.preventDefault();
        MuncherSettings.setRecommendedCharacterActiveEffectSettings(html);
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
        switch (event.currentTarget.dataset.section) {
          case "create-scene": {
            game.settings.set(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene", false);
            if (event.currentTarget.checked) $("#encounter-scene-select").prop("disabled", true);
            $("#encounter-scene-img-select").prop("disabled", !event.currentTarget.checked);
            $("#encounter-import-policy-existing-scene").prop('checked', false);
            break;
          }
          case "existing-scene": {
            game.settings.set(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene", false);
            if (event.currentTarget.checked) $("#encounter-scene-img-select").prop("disabled", true);
            $("#encounter-scene-select").prop("disabled", !event.currentTarget.checked);
            $("#encounter-import-policy-create-scene").prop('checked', false);
            break;
          }
          // no default
        };
        game.settings.set(
          "ddb-importer",
          "encounter-import-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked
        );
      });

    // img change
    html.find("#encounter-scene-img-select").on("change", async () => {
      const imgSelect = html.find("#encounter-scene-img-select");
      this.img = imgSelect[0].selectedOptions[0] ? imgSelect[0].selectedOptions[0].value : "";
    });

    html.find("#encounter-scene-select").on("change", async () => {
      const imgSelect = html.find("#encounter-scene-select");
      this.sceneId = imgSelect[0].selectedOptions[0] ? imgSelect[0].selectedOptions[0].value : "";
    });

    // filter campaigns
    html.find("#encounter-campaign-select").on("change", async () => {
      const campaignSelection = html.find("#encounter-campaign-select");
      // get selected campaign from html selection
      const campaignId = campaignSelection[0].selectedOptions[0]
        ? campaignSelection[0].selectedOptions[0].value
        : undefined;
      const encounters = await this.ddbEncounters.filterEncounters(campaignId);
      const campaignSelected = campaignId && campaignId !== "";
      let encounterList = `<option value="">Select encounter:</option>`;
      encounters.forEach((encounter) => {
        encounterList += `<option value="${encounter.id}">${encounter.name}${
          campaignSelected || !encounter.campaign ? "" : ` (${encounter.campaign.name})`
        }</option>\n`;
      });
      const list = html.find("#encounter-select");
      list[0].innerHTML = encounterList;
      this.resetEncounter(html);
    });

    // encounter change
    html.find("#encounter-select").on("change", async () => {
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
      const progressHtml = html.find("#ddb-encounter-progress");

      const missingCharacters = encounter.missingCharacters
        ? `fa-times-circle' style='color: red`
        : `fa-check-circle' style='color: green`;
      const missingMonsters = encounter.missingMonsters
        ? `fa-times-circle' style='color: red`
        : `fa-check-circle' style='color: green`;

      const goodCharacters = encounter.goodCharacterData.map((character) => `${character.name}`).join(", ");
      const goodMonsters = encounter.goodMonsterIds.map((monster) => `${monster.name}`).join(", ");
      const neededCharactersHTML = encounter.missingCharacters
        ? ` <span style="color: red"> Missing ${
          encounter.missingCharacterData.length
        }: ${encounter.missingCharacterData.map((character) => character.name).join(", ")}</span>`
        : "";
      const neededMonstersHTML = encounter.missingMonsters
        ? ` <span style="color: red"> Missing ${
          encounter.missingMonsterIds.length
        }. DDB Id's: ${encounter.missingMonsterIds.map((monster) => monster.ddbId).join(", ")}</span>`
        : "";

      nameHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Encounter:</b> ${encounter.name}`;
      if (encounter.summary && encounter.summary.trim() !== "") {
        summaryHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Summary:</b> ${encounter.summary}`;
      }
      if (encounter.goodCharacterData.length > 0 || encounter.missingCharacterData.length > 0) {
        charactersHtml[0].innerHTML = `<i class='fas ${missingCharacters}'></i> <b>Characters:</b> ${goodCharacters}${neededCharactersHTML}`;
      }
      if (encounter.goodMonsterIds.length > 0 || encounter.missingMonsterIds.length > 0) {
        monstersHtml[0].innerHTML = `<i class='fas ${missingMonsters}'></i> <b>Monsters:</b> ${goodMonsters}${neededMonstersHTML}`;
      }
      difficultyHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Difficulty:</b> <span style="color: ${encounter.difficulty.color}">${encounter.difficulty.name}</span>`;
      if (encounter.rewards && encounter.rewards.trim() !== "") {
        rewardsHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Rewards:</b> ${encounter.rewards}`;
      }

      progressHtml[0].innerHTML = encounter.inProgress
        ? `<i class='fas fa-times-circle' style='color: red'></i> <b>In Progress:</b> <span style="color: red"> Encounter in progress on <a href="https://www.dndbeyond.com/combat-tracker/${this.encounter.id}">D&D Beyond!</a></span>`
        : `<i class='fas fa-check-circle' style='color: green'></i> <b>In Progress:</b> No`;

      $("#encounter-import-policy-use-ddb-save").prop("disabled", !encounter.inProgress);
      $("#ddb-importer-encounters").css("height", "auto");
      $("#encounter-button").prop("disabled", false);
    });

    // import encounter
    html.find("#encounter-button").click(async (event) => {
      event.preventDefault();
      $("#encounter-button").prop("disabled", true);
      $("#encounter-button").prop("innerText", "Munching...");

      await this.importMonsters();
      await this.importCharacters(html);
      await this.createJournalEntry();
      const scene = await this.createScene();
      if (scene) {
        logger.info(`Scene ${scene.id} created`);
        await this.createCombatEncounter();
      };

      // to do:
      // adjust monsters hp?
      // add initiative if combat in progress?
      // - extra import?
      // - attempt to find magic items and add them to the world?

      $("#encounter-button").prop("innerText", "Encounter Munched");
      const campaignFluff
        = this.encounter.campaign?.name && this.encounter.campaign.name.trim() !== "" ? ` of ${this.encounter.name}` : "";
      ui.notifications.warn(`Prepare to battle heroes${campaignFluff}, your doom awaits in ${this.encounter.name}!`);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async getData() {
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);
    const availableCampaigns = await DDBCampaigns.getAvailableCampaigns();
    const availableEncounters = await this.ddbEncounters.filterEncounters();

    const characterSettings = MuncherSettings.getCharacterImportSettings();
    const muncherSettings = MuncherSettings.getMuncherSettings(false);

    const importSettings = foundry.utils.mergeObject(characterSettings, muncherSettings);

    const encounterConfig = [
      {
        name: "missing-characters",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-characters"),
        enabled: true,
        description: "Import missing characters?",
      },
      {
        name: "missing-monsters",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-monsters"),
        enabled: true,
        description: "Import missing monsters?",
      },
      {
        name: "create-journal",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-journal"),
        enabled: true,
        description: "Create encounter journal entry?",
      },
      {
        name: "use-ddb-save",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-use-ddb-save"),
        enabled: false,
        description: "Use save information from Encounter (HP for monsters and initiative for all)?",
      },
      {
        name: "create-scene",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene"),
        enabled: true,
        description: "Create/update a scene to use, and add available characters and NPC's?",
      },
      {
        name: "existing-scene",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene"),
        enabled: true,
        description: "Use an existing scene?",
      },
    ];

    const scenes = game.scenes.filter((scene) => !scene.flags?.ddbimporter?.encounters)
      .map((scene) => {
        const folderName = scene.folder ? `[${scene.folder.name}] ` : "";
        const s = {
          name: `${folderName}${scene.name}`,
          id: scene.id,
        };
        return s;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const encounterSettings = {
      tiers,
      availableCampaigns,
      availableEncounters,
      encounterConfig,
      sceneImg: DDBEncounterMunch.SCENE_IMG,
      scenes,
      createSceneSelect: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene"),
      existingSceneSelect: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene"),
    };

    const data = foundry.utils.mergeObject(importSettings, encounterSettings);
    logger.debug("Encounter muncher form data", data);

    return data;
  }
}
