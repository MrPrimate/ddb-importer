import {
  logger,
  utils,
  CompendiumHelper,
  FolderHelper,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBMonsterFactory from "./DDBMonsterFactory.js";
import DDBCharacterImporter from "../muncher/DDBCharacterImporter.mjs";

export default class DDBEncounter {

  constructor({ ddbEncounterData, notifier, img = "", sceneId = "" } = {}) {
    this.data = {};
    this.img = img;
    this.sceneId = sceneId;
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

    this.ddbEncounterData = ddbEncounterData;
  }

  static DIFFICULTY_LEVELS = [
    { id: null, name: "No challenge", color: "grey" },
    { id: 1, name: "Easy", color: "green" },
    { id: 2, name: "Medium", color: "brown" },
    { id: 3, name: "Hard", color: "orange" },
    { id: 4, name: "Deadly", color: "red" },
  ];

  async parseEncounter() {
    const monsterPack = CompendiumHelper.getCompendiumType("monster", false);
    await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });

    let goodMonsterIds = [];
    let missingMonsterIds = [];
    logger.debug("Parsing encounter", this.ddbEncounterData);
    this.ddbEncounterData.monsters.forEach((monster) => {
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
    this.ddbEncounterData.players
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

    const difficulty = DDBEncounter.DIFFICULTY_LEVELS.find((level) => level.id == this.ddbEncounterData.difficulty);

    this.data = {
      id: this.ddbEncounterData.id,
      name: this.ddbEncounterData.name,
      inProgress: this.ddbEncounterData.inProgress,
      turnNum: this.ddbEncounterData.turnNum,
      roundNum: this.ddbEncounterData.roundNum,
      difficulty,
      description: this.ddbEncounterData.description,
      rewards: this.ddbEncounterData.rewards,
      summary: this.ddbEncounterData.flavorText,
      campaign: this.ddbEncounterData.campaign,
      monsters: this.ddbEncounterData.monsters,
      characters: this.ddbEncounterData.players,
      goodMonsterIds,
      missingMonsterIds,
      goodCharacterData,
      missingCharacterData,
      missingMonsters: missingMonsterIds.length !== 0,
      missingCharacters: missingCharacterData.length !== 0,
    };

    this.folders = {};

    logger.debug("Current encounter", this.data);

    return this.data;
  }

  resetEncounter() {
    this.data = {};
    this.journal = undefined;
    this.combat = undefined;
    this.tokens = [];
  }

  async #importMonsters() {
    const importMonsters = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-monsters");

    if (importMonsters && this.data.missingMonsters && this.data.missingMonsterIds.length > 0) {
      logger.debug("Importing missing monsters from DDB");
      const monsterFactory = new DDBMonsterFactory({ notifier: this.munchNote.bind(this) });
      await monsterFactory.processIntoCompendium(this.data.missingMonsterIds.map((monster) => monster.ddbId));
      logger.debug("Finised Importing missing monsters from DDB");
    }

    const monsterPack = CompendiumHelper.getCompendiumType("monster", false);
    await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });
    const compendiumName = CompendiumHelper.getCompendiumLabel("monster");

    let monstersToAddToWorld = [];
    this.data.monsterData = [];
    this.data.worldMonsters = [];
    let journalMonsterInfo = new Map();
    this.data.monsters.forEach((monster) => {
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
    this.data.monsterData = Object.values(journalMonsterInfo);

    const encounterMonsterFolder = await FolderHelper.getFolder(
      "npc",
      this.data.name,
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
      this.data.worldMonsters.push(foundry.utils.mergeObject(actor, { id: worldActor.id }));
    });

    return new Promise((resolve) => {
      resolve(this.data.worldMonsters);
    });
  }

  async #importCharacters() {
    const importCharacters = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-characters");
    if (importCharacters && this.data.missingCharacters) {
      await utils.asyncForEach(this.data.missingCharacterData, async (character) => {
        await DDBCharacterImporter.importCharacterById(character.ddbId, this.characterNotifier.bind(this));
      });
    }
  }

  async #createJournalEntry() {
    logger.debug(`Creating journal entry`);
    const journal = {
      name: this.data.name,
      flags: {
        ddbimporter: {
          encounterId: this.data.id,
        },
      },
    };

    const importJournal = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-journal");
    if (importJournal) {
      const journalFolder = await FolderHelper.getFolder(
        "journal",
        this.data.name,
        "D&D Beyond Encounters",
        "#6f0006",
        "#98020a",
        false,
      );
      journal.folder = journalFolder.id;
      journal.content = `<h1>${this.data.name}</h1>`;
      if (this.data.summary && this.data.summary != "") {
        journal.content += `<h2>Summary</h2>${this.data.summary}`;
      }
      if (this.data.monsterData && this.data.monsterData.length > 0) {
        journal.content += `<h2>Monsters</h2><ul>`;
        this.data.monsterData.forEach((monster) => {
          journal.content += `<li><p>${monster.journalLink} x${monster.quantity}</p></li>`;
        });
        journal.content += `</ul>`;
      }
      if (this.data.difficulty && this.data.difficulty != "") {
        journal.content += `<h2>Difficulty: <span style="color: ${this.data.difficulty.color}">${this.data.difficulty.name}</span></h3>`;
      }
      if (this.data.description && this.data.description != "") {
        journal.content += `<h2>Description</h2>${this.data.description}`;
      }
      if (this.data.rewards && this.data.rewards != "") {
        journal.content += `<h2>Rewards</h2>${this.data.rewards}`;
      }

      let worldJournal = game.journal.find(
        (a) => a.folder == journalFolder.id && a.flags?.ddbimporter?.encounterId == this.data.id,
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


  async #createNewScene() {
    this.folders["scene"] = await FolderHelper.getFolder(
      "scene",
      this.data.name,
      "D&D Beyond Encounters",
      "#6f0006",
      "#98020a",
      false,
    );

    let sceneData = {
      name: this.data.name,
      flags: {
        ddbimporter: {
          encounterId: this.data.id,
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
  async #createScene() {
    const importDDBIScene = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene");
    const useExistingScene = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene");

    if (!importDDBIScene && !useExistingScene) return undefined;

    let sceneData;
    let worldScene;

    if (importDDBIScene) {
      logger.debug(`Creating scene for encounter "${this.data.name}""`);
      sceneData = await this.#createNewScene();
    } else if (useExistingScene) {
      worldScene = game.scenes.find((s) => s.id == this.sceneId);
      if (worldScene) {
        sceneData = worldScene.toObject();
        logger.debug(`Using existing scene "${worldScene.name}" for encounter "${this.data.name}""`, { worldScene, sceneData });
      } else {
        logger.warn(`Unable to find scene ${this.sceneId}, creating a new scene `);
        throw new Error(`Unable to find scene ${this.sceneId}, creating a new scene `);
      }
      this.scene = worldScene;
    }

    if (sceneData) {
      let tokenData = [];
      const useDDBSave
        = this.data.inProgress && game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-use-ddb-save");
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
      this.data.characters
        .filter((character) => !character.hidden)
        .forEach(async (character) => {
          logger.info(`Generating token ${character.name} for ${this.data.name}`);
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
              foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounterId`, this.data.id);
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
      for (const worldMonster of this.data.worldMonsters) {
        logger.info(`Generating token ${worldMonster.ddbName} (${worldMonster.name}) for ${this.data.name}`);
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
        foundry.utils.setProperty(linkedToken, "flags.ddbimporter.encounterId", this.data.id);
        foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.dndbeyond.uniqueId`, worldMonster.uniqueId);
        foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounters`, true);
        foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounterId`, this.data.id);
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
          && a.flags?.ddbimporter?.encounterId == this.data.id,
        );
      }

      if (worldScene) {
        logger.info(`Updating scene ${sceneData.name}`);
        const existingCombats = game.combats.filter((c) =>
          c.scene?.id == worldScene.id
          && c.flags?.ddbimporter?.encounterId == this.data.id,
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
            .filter((t) => t.flags?.ddbimporter?.encounterId == this.data.id && t.actor.type == "npc")
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

  async #createCombatEncounter() {
    const importCombat = game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene")
      || game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene");

    if (!importCombat) return undefined;
    logger.debug(`Creating combat for encounter ${this.data.name}`);

    const useDDBSave
      = this.data.inProgress && game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-use-ddb-save");

    await this.scene.view();
    const flags = {
      "ddbimporter.encounterId": this.data.id,
    };
    this.combat = await Combat.create({ scene: this.scene.id, flags: flags });
    await this.combat.activate();

    let toCreate = [];
    const tokens = canvas.tokens.placeables
      .filter((t) => t.document.flags?.ddbimporter?.encounterId == this.data.id || t.actor.type == "character");
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

  async importEncounter({ img = null, sceneId = null } = {}) {
    if (img) this.img = img;
    if (sceneId) this.sceneId = sceneId;
    await this.#importMonsters();
    await this.#importCharacters();
    await this.#createJournalEntry();
    const scene = await this.#createScene();
    if (scene) {
      logger.info(`Scene ${scene.id} created`);
      await this.#createCombatEncounter();
    };
    // to do?
    // adjust monsters hp?
    // add initiative if combat in progress?
    // - extra import?
    // - attempt to find magic items and add them to the world?
  }

}
