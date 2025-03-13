import {
  logger,
  utils,
  CompendiumHelper,
  FolderHelper,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBEncounters from "../parser/DDBEncounters.js";
import DDBMonsterFactory from "../parser/DDBMonsterFactory.js";
import DDBCharacterImporter from "../muncher/DDBCharacterImporter.mjs";

export default class DDBEncounterImporter {

  constructor({ notifier }) {
    this.encounter = {};
    this.img = "";
    this.sceneId = "";
    this.journal = undefined;
    this.combat = undefined;
    this.tokens = [];
    this.folders = {};

    this.notifier = notifier;

    if (!notifier) {
      this.notifier = (note, { nameField = false, monsterNote = false, message = false, isError = false } = {}) => {
        logger.info(note, { nameField, monsterNote, message, isError });
      };
    }

    this.ddbEncounters = new DDBEncounters({
      notifier: this.notifier,
    });
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
            && actor.flags.ddbimporter.dndbeyond.characterId == character.id,
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

  resetEncounter() {
    this.encounter = {};
    this.journal = undefined;
    this.combat = undefined;
    this.tokens = [];
  }

  async importMonsters() {
    const importMonsters = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-monsters");

    if (importMonsters && this.encounter.missingMonsters && this.encounter.missingMonsterIds.length > 0) {
      logger.debug("Importing missing monsters from DDB");
      const monsterFactory = new DDBMonsterFactory({ notifier: this.munchNote.bind(this) });
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
      false,
    );

    logger.debug("Trying to import monsters from compendium", monstersToAddToWorld);
    await utils.asyncForEach(monstersToAddToWorld, async (actor) => {
      let worldActor = game.actors.find(
        (a) => a.folder?.id == encounterMonsterFolder.id && a.flags?.ddbimporter?.id == actor.ddbId,
      );
      if (!worldActor) {
        logger.info(
          `Importing monster ${actor.name} with DDB ID ${actor.ddbId} from ${monsterPack.metadata.name} with id ${actor.id}`,
        );
        try {
          worldActor = await game.actors.importFromCompendium(monsterPack, actor.id, {
            folder: encounterMonsterFolder.id,
          });
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to import actor ${actor.name} with id ${actor.id} from DDB Compendium`);
          logger.debug(
            `Failed on: game.actors.importFromCompendium(monsterCompendium, "${actor.id}", { folder: "${encounterMonsterFolder.id}" });`,
          );
        }
      }
      this.encounter.worldMonsters.push(foundry.utils.mergeObject(actor, { id: worldActor.id }));
    });

    return new Promise((resolve) => {
      resolve(this.encounter.worldMonsters);
    });
  }

  async importCharacters() {
    const importCharacters = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-characters");
    if (importCharacters && this.encounter.missingCharacters) {
      await utils.asyncForEach(this.encounter.missingCharacterData, async (character) => {
        await DDBCharacterImporter.importCharacterById(character.ddbId, this.characterNotifier.bind(this));
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
        false,
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
        (a) => a.folder == journalFolder.id && a.flags?.ddbimporter?.encounterId == this.encounter.id,
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
      false,
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
              && actor.flags.ddbimporter.dndbeyond.characterId == character.id,
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
              worldMonster.currentHitPoints + worldMonster.temporaryHitPoints,
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
          && a.flags?.ddbimporter?.encounterId == this.encounter.id,
        );
      }

      if (worldScene) {
        logger.info(`Updating scene ${sceneData.name}`);
        const existingCombats = game.combats.filter((c) =>
          c.scene?.id == worldScene.id
          && c.flags?.ddbimporter?.encounterId == this.encounter.id,
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
        "encounter-import-policy-roll-monster-initiative",
      );
      combatants
        .filter((c) => rollMonsterInitiative && c.actor.type === "npc" && c.initiative === null)
        .forEach(async (c) => {
          if (c.initiative === null) await this.combat.rollInitiative(c.id);
        });
    }

    return this.combat;
  }

  async importEncounter() {
    await this.encounterImporter.importMonsters();
    await this.encounterImporter.importCharacters();
    await this.encounterImporter.createJournalEntry();
    const scene = await this.encounterImporter.createScene();
    if (scene) {
      logger.info(`Scene ${scene.id} created`);
      await this.encounterImporter.createCombatEncounter();
    };
    // to do?
    // adjust monsters hp?
    // add initiative if combat in progress?
    // - extra import?
    // - attempt to find magic items and add them to the world?
  }

}
