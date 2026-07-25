import {
  logger,
  utils,
  CompendiumHelper,
  FolderHelper,
} from "../../lib/_module";
import DDBMonsterFactory from "../DDBMonsterFactory";
import DDBCharacterImporter from "../../muncher/DDBCharacterImporter";

const DEFAULT_LEVEL_ID = "defaultLevel0000";

type TEncounterNotifier = (
  note: string,
  options?: { nameField?: boolean; monsterNote?: boolean; message?: boolean | string; isError?: boolean },
) => void;

interface IDDBEncounterOptions {
  ddbEncounterData?: IDDBEncounterData;
  notifier?: TEncounterNotifier;
  img?: string;
  sceneId?: string;
}

export default class DDBEncounter {

  data: IEncounterParsedData;
  img: string;
  sceneId: string;
  journal: JournalEntry | undefined;
  journalPage: JournalEntryPage | undefined;
  combat: Combat | undefined;
  folders: Record<string, Folder.Implementation>;
  scene: Scene | undefined;
  notifier: TEncounterNotifier;
  ddbEncounterData: IDDBEncounterData;

  constructor({ ddbEncounterData, notifier, img = "", sceneId = "" }: IDDBEncounterOptions = {}) {
    this.data = {};
    this.img = img;
    this.sceneId = sceneId;
    this.journal = undefined;
    this.journalPage = undefined;
    this.combat = undefined;
    this.folders = {};

    this.notifier = notifier ?? ((note, { nameField = false, monsterNote = false, message = false, isError = false } = {}) => {
      logger.info(note, { nameField, monsterNote, message, isError });
    });

    if (!ddbEncounterData) {
      throw new Error("DDBEncounter requires ddbEncounterData");
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
    if (!monsterPack) {
      logger.warn("Unable to find monster compendium, unable to parse encounter");
      return this.data;
    }
    await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });

    const goodMonsterIds: { ddbId: number; name: string; id: string; quantity: number }[] = [];
    const missingMonsterIds: { ddbId: number; quantity: number }[] = [];
    logger.debug("Parsing encounter", this.ddbEncounterData);
    this.ddbEncounterData.monsters.forEach((monster) => {
      const id = monster.id;
      const monsterInPack = monsterPack.index.find((f: any) => f.flags?.ddbimporter?.id == id);
      if (monsterInPack) {
        goodMonsterIds.push({ ddbId: id, name: monsterInPack.name ?? "", id: monsterInPack._id, quantity: monster.quantity });
      } else {
        missingMonsterIds.push({ ddbId: id, quantity: monster.quantity });
      }
    });

    const goodCharacterData: { id: string; name: string; ddbId: number | string }[] = [];
    const missingCharacterData: { ddbId: number | string; name?: string }[] = [];
    this.ddbEncounterData.players
      .filter((character) => !character.hidden)
      .forEach((character) => {
        const characterInGame = game.actors.find(
          (actor: any) =>
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
    this.journalPage = undefined;
    this.combat = undefined;
  }

  async #importMonsters() {
    const importMonsters = utils.getSetting<boolean>("encounter-import-policy-missing-monsters");

    const missingMonsterIds = this.data.missingMonsterIds ?? [];
    if (importMonsters && this.data.missingMonsters && missingMonsterIds.length > 0) {
      logger.debug("Importing missing monsters from DDB");
      const monsterFactory = new DDBMonsterFactory({ notifier: this.notifier });
      await monsterFactory.processIntoCompendium(missingMonsterIds.map((monster) => monster.ddbId));
      logger.debug("Finised Importing missing monsters from DDB");
    }

    const monsterPack = CompendiumHelper.getCompendiumType("monster", false) as CompendiumCollection<"Actor">;
    await monsterPack.getIndex({ fields: ["name", "flags.ddbimporter.id"] });
    const compendiumName = CompendiumHelper.getCompendiumLabel("monster");

    const monstersToAddToWorld: IEncounterWorldMonsterData[] = [];
    const worldMonsters: IEncounterWorldMonsterData[] = [];
    this.data.monsterData = [];
    this.data.worldMonsters = worldMonsters;
    const journalMonsterInfo = new Map();
    (this.data.monsters ?? []).forEach((monster) => {
      const id = monster.id;
      const monsterInPack = monsterPack.index.find((f: any) => f.flags?.ddbimporter?.id == id);
      if (monsterInPack) {
        let monsterData: IEncounterWorldMonsterData = {
          ddbId: id,
          name: monsterInPack.name ?? "",
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
          const addData = foundry.utils.deepClone(monsterData) as IEncounterWorldMonsterData;
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
        (a: any) => a.folder?.id == encounterMonsterFolder.id && a.flags?.ddbimporter?.id == actor.ddbId,
      );
      if (!worldActor) {
        logger.info(
          `Importing monster ${actor.name} with DDB ID ${actor.ddbId} from ${monsterPack.metadata.name} with id ${actor.id}`,
        );
        try {
          const options = {
            folder: encounterMonsterFolder.id,
          };
          worldActor = await game.actors.importFromCompendium(monsterPack, actor.id, options as any);
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to import actor ${actor.name} with id ${actor.id} from DDB Compendium`);
          logger.debug(
            `Failed on: game.actors.importFromCompendium(monsterCompendium, "${actor.id}", { folder: "${encounterMonsterFolder.id}" });`,
          );
        }
      }
      if (!worldActor) {
        logger.warn(`No world actor available for monster ${actor.name} (${actor.ddbId}), skipping`);
        return;
      }
      worldMonsters.push(foundry.utils.mergeObject(actor, { id: worldActor.id }) as unknown as IEncounterWorldMonsterData);
    });

    return new Promise((resolve) => {
      resolve(this.data.worldMonsters);
    });
  }

  async #importCharacters() {
    const importCharacters = utils.getSetting<boolean>("encounter-import-policy-missing-characters");
    if (importCharacters && this.data.missingCharacters) {
      await utils.asyncForEach(this.data.missingCharacterData ?? [], async (character) => {
        await DDBCharacterImporter.importCharacterById(character.ddbId, this.notifier);
      });
    }
  }

  #buildJournalPageContent(): string {
    let content = "";
    if (this.data.summary && this.data.summary != "") {
      content += `<h2>Summary</h2>${this.data.summary}`;
    }
    if (this.data.monsterData && this.data.monsterData.length > 0) {
      content += `<h2>Monsters</h2><ul>`;
      this.data.monsterData.forEach((monster) => {
        content += `<li><p>${monster.journalLink} x${monster.quantity}</p></li>`;
      });
      content += `</ul>`;
    }
    if (this.data.difficulty && this.data.difficulty != "") {
      content += `<h2>Difficulty: <span style="color: ${this.data.difficulty.color}">${this.data.difficulty.name}</span></h2>`;
    }
    if (this.data.description && this.data.description != "") {
      content += `<h2>Description</h2>${this.data.description}`;
    }
    if (this.data.rewards && this.data.rewards != "") {
      content += `<h2>Rewards</h2>${this.data.rewards}`;
    }
    return content;
  }

  async #getEncountersJournal(): Promise<JournalEntry | undefined> {
    const journalFolder = await FolderHelper.getFolder(
      "journal",
      "",
      "D&D Beyond Encounters",
      "#6f0006",
      "#98020a",
      false,
    );

    let worldJournal = game.journal.find(
      (j) => j.name === "DDB Encounters" && j.flags?.ddbimporter?.encounters === true,
    ) as JournalEntry | undefined;

    if (!worldJournal) {
      logger.info(`Creating journal DDB Encounters`);
      try {
        worldJournal = await JournalEntry.create({
          name: "DDB Encounters",
          folder: journalFolder.id,
          flags: {
            ddbimporter: {
              encounters: true,
            },
          },
        } as unknown as JournalEntry.CreateInput);
      } catch (err) {
        logger.error(err);
        logger.warn(`Unable to create journal DDB Encounters`);
      }
    }
    return worldJournal;
  }

  async #createJournalEntry() {
    const importJournal = utils.getSetting<boolean>("encounter-import-policy-create-journal");
    if (!importJournal) return;

    logger.debug(`Creating journal entry`);
    const worldJournal = await this.#getEncountersJournal();
    if (!worldJournal) return;

    const content = this.#buildJournalPageContent();
    const existingPage = worldJournal.pages.find(
      (p: JournalEntryPage) => p.flags?.ddbimporter?.encounterId == this.data.id,
    );

    if (existingPage) {
      logger.info(`Updating journal page ${this.data.name}`);
      const update = {
        _id: existingPage.id,
        name: this.data.name,
        text: {
          content,
        },
      };
      await worldJournal.updateEmbeddedDocuments("JournalEntryPage", [update as unknown as JournalEntryPage.UpdateData]);
    } else {
      logger.info(`Creating journal page ${this.data.name}`);
      const pageData: I5eJournalPageData = {
        name: this.data.name,
        type: "text",
        title: {
          show: true,
          level: 1,
        },
        text: {
          content,
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
        },
        flags: {
          ddbimporter: {
            encounterId: this.data.id,
          },
        },
      };
      await worldJournal.createEmbeddedDocuments("JournalEntryPage", [pageData as any]);
    }

    this.journal = worldJournal;
    this.journalPage = worldJournal.pages.find(
      (p: JournalEntryPage) => p.flags?.ddbimporter?.encounterId == this.data.id,
    );
  }


  async #buildNewScene() {
    this.folders["scene"] = await FolderHelper.getFolder(
      "scene",
      "",
      "D&D Beyond Encounters",
      "#6f0006",
      "#98020a",
      false,
    );

    const sceneData: I5eSceneData = {
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
      levels: [
        {
          _id: DEFAULT_LEVEL_ID,
          name: "Level",
          background: {
            src: this.img ?? null,
            color: "#999999",
            tint: "#ffffff",
            alphaThreshold: 0.75,
          },
          foreground: null,
          textures: {
            anchorX: 0.5,
            anchorY: 0.5,
            offsetX: 0,
            offsetY: 0,
            fit: "fill",
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
          },
        },
      ],
      initialLevel: DEFAULT_LEVEL_ID,
      shiftX: 0,
      shiftY: 0,
      fog: {
        mode: 0,
        colors: {},
      },
      transition: {
        type: "fade",
        duration: 1500,
        activeOnly: true,
      },
      folder: this.folders["scene"].id ?? undefined,
    };

    // console.warn("Creating scene", sceneData);

    return sceneData;

  }


  async #createScene() {
    const importDDBIScene = utils.getSetting<boolean>("encounter-import-policy-create-scene");
    const useExistingScene = utils.getSetting<boolean>("encounter-import-policy-existing-scene");

    if (!importDDBIScene && !useExistingScene) return undefined;

    let sceneData: I5eSceneData | undefined;
    let worldScene: Scene | undefined;

    if (importDDBIScene) {
      logger.debug(`Creating scene for encounter "${this.data.name}""`);
      sceneData = await this.#buildNewScene();
    } else if (useExistingScene) {
      worldScene = game.scenes.find((s) => s.id == this.sceneId);
      if (worldScene) {
        sceneData = worldScene.toObject() as unknown as I5eSceneData;
        logger.debug(`Using existing scene "${worldScene.name}" for encounter "${this.data.name}""`, { worldScene, sceneData });
      } else {
        logger.warn(`Unable to find scene ${this.sceneId}, creating a new scene `);
        throw new Error(`Unable to find scene ${this.sceneId}, creating a new scene `);
      }
      this.scene = worldScene;
    }

    if (sceneData) {
      const tokenData = [];
      const useDDBSave
        = this.data.inProgress && utils.getSetting<boolean>("encounter-import-policy-use-ddb-save");
      // fallbacks match the defaults used by #buildNewScene; existing scenes always carry these values
      const gridSize = sceneData.grid?.size ?? 100;
      const sceneWidth = sceneData.width ?? 1000;
      const sceneHeight = sceneData.height ?? 1000;
      const scenePadding = sceneData.padding ?? 0.25;
      const xSquares = sceneWidth / gridSize;
      const ySquares = sceneHeight / gridSize;
      const midSquareOffset = gridSize / 2;
      const widthPaddingOffset = sceneWidth * scenePadding;
      const heightPaddingOffset = sceneHeight * scenePadding;
      const xPCOffset = gridSize * (xSquares - 1);
      const xStartPixelMonster = widthPaddingOffset + midSquareOffset;
      const xStartPixelPC = xStartPixelMonster + xPCOffset;
      const yStartPixel = heightPaddingOffset + midSquareOffset;
      let characterCount = 0;
      (this.data.characters ?? [])
        .filter((character) => !character.hidden)
        .forEach(async (character) => {
          logger.info(`Generating token ${character.name} for ${this.data.name}`);
          const characterInGame = game.actors.find(
            (actor) =>
              foundry.utils.getProperty(actor, "flags.ddbimporter.dndbeyond.characterId") == character.id,
          );
          if (characterInGame) {
            const onScene = (useExistingScene && worldScene?.tokens
              .some((t: TokenDocument) => foundry.utils.getProperty(t.actor ?? {}, "flags.ddbimporter.id") == character.id && t.actor?.type == "character")) ?? false;

            if (!onScene) {
              const linkedToken = foundry.utils.duplicate(await characterInGame.getTokenDocument());
              linkedToken.delta ??= {};
              if (useDDBSave) {
                foundry.utils.setProperty(linkedToken, "flags.ddbimporter.dndbeyond.initiative", character.initiative);
              }
              foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounters`, true);
              foundry.utils.setProperty(linkedToken, `delta.flags.ddbimporter.encounterId`, this.data.id);
              linkedToken.x = xStartPixelPC;
              const yOffsetChange = characterCount * gridSize;
              linkedToken.y = yStartPixel + yOffsetChange;
              tokenData.push(linkedToken);
              characterCount++;
            }
          }
        });

      let monsterDepth = 0;
      let monsterRows = 0;
      let rowMonsterWidth = 1;
      for (const worldMonster of this.data.worldMonsters ?? []) {
        logger.info(`Generating token ${worldMonster.ddbName} (${worldMonster.name}) for ${this.data.name}`);
        const monster = game.actors.get(worldMonster.id);
        const linkedToken = foundry.utils.duplicate(await monster.getTokenDocument());
        linkedToken.delta ??= {};
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
        const xOffsetChange = gridSize * monsterRows;
        const yOffsetChange = monsterDepth * gridSize;
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
              (worldMonster.currentHitPoints ?? 0) + (worldMonster.temporaryHitPoints ?? 0),
            );
          }
        }

        tokenData.push(linkedToken);
        monsterDepth += linkedToken.height;
        if (linkedToken.width > rowMonsterWidth) rowMonsterWidth = linkedToken.width;
      }

      if (this.journal?.id) sceneData.journal = this.journal.id;
      if (this.journalPage?.id) sceneData.journalEntryPage = this.journalPage.id;

      if (importDDBIScene) {
        worldScene = game.scenes.find(
          (a: Scene) => (a.folder as unknown as string) == this.folders["scene"].id
          && a.flags?.ddbimporter?.encounterId == this.data.id,
        );
      }

      if (worldScene) {
        const existingScene = worldScene;
        logger.info(`Updating scene ${sceneData.name}`);
        const existingCombats = game.combats.filter((c) =>
          c.scene?.id == existingScene.id
          && foundry.utils.getProperty(c, "flags.ddbimporter.encounterId") == this.data.id,
        );
        await Combat.deleteDocuments(existingCombats.map((c) => c.id));
        if (importDDBIScene) {
          logger.info(`Updating DDBI scene ${sceneData.name}`);
          sceneData._id = existingScene.id ?? undefined;
          await existingScene.deleteEmbeddedDocuments("Token", [], { deleteAll: true });
          await existingScene.update(foundry.utils.mergeObject(existingScene.toObject(), sceneData) as unknown as Scene.UpdateData);
        } else if (useExistingScene) {
          logger.info(`Checking existing scene ${sceneData.name} for encounter monsters`);
          const existingSceneMonsterIds = existingScene.tokens
            .filter((t: any) => t.flags?.ddbimporter?.encounterId == this.data.id && t.actor.type == "npc")
            .map((t: any) => t.id);
          await existingScene.deleteEmbeddedDocuments("Token", existingSceneMonsterIds);
        }
      } else if (importDDBIScene) {
        logger.info(`Importing scene ${sceneData.name}`);
        try {
          worldScene = await Scene.create(sceneData as unknown as Scene.CreateData) as Scene;
        } catch (err) {
          logger.error(err);
          logger.warn(`Unable to create scene ${sceneData.name}`);
        }
      }

      if (!worldScene) {
        logger.warn(`No scene available for encounter ${this.data.name}, unable to place tokens`);
        return undefined;
      }

      const thumbData = await worldScene.createThumbnail();
      const thumbScene = worldScene.toObject();
      thumbScene["thumb"] = thumbData.thumb;

      logger.debug("Creating tokenens on scene", tokenData);
      worldScene = (await worldScene.update(thumbScene as unknown as Scene.UpdateData, { keepId: true } as any)) ?? worldScene;

      await worldScene.createEmbeddedDocuments("Token", tokenData as any);

      this.scene = worldScene;
    }
    logger.debug("Scene created", this.scene);

    this.scene?.render();

    return this.scene;
  }

  async #createCombatEncounter() {
    const importCombat = utils.getSetting<boolean>("encounter-import-policy-create-scene")
      || utils.getSetting<boolean>("encounter-import-policy-existing-scene");

    if (!importCombat) return undefined;
    logger.debug(`Creating combat for encounter ${this.data.name}`);

    const scene = this.scene;
    if (!scene) {
      logger.warn(`No scene available for encounter ${this.data.name}, unable to create combat`);
      return undefined;
    }

    const useDDBSave
      = this.data.inProgress && utils.getSetting<boolean>("encounter-import-policy-use-ddb-save");

    await scene.view();
    const flags: Record<string, any> = {
      "ddbimporter.encounterId": this.data.id,
    };
    const combat = await Combat.create({ scene: scene.id, flags: flags } as unknown as Combat.CreateInput) as Combat;
    this.combat = combat;
    await combat.activate();

    const toCreate: ICombatantData[] = [];
    const tokens = canvas.tokens.placeables
      .filter((t: any) => foundry.utils.getProperty(t.document, "flags.ddbimporter.encounterId") == this.data.id || t.actor.type == "character");
    if (tokens.length) {
      tokens.forEach((t) => {
        const combatant: ICombatantData = {
          tokenId: t.id,
          actorId: t.document.actorId,
          hidden: t.document.hidden,
        };
        const ddbInitiative = foundry.utils.getProperty(t.document, "flags.ddbimporter.dndbeyond.initiative") as number | undefined;
        if (useDDBSave && ddbInitiative) combatant.initiative = ddbInitiative;
        if (!t.inCombat) toCreate.push(combatant);
      });
      const combatants = await combat.createEmbeddedDocuments("Combatant", toCreate as unknown as any) as unknown as Combatant.Known[];

      const rollMonsterInitiative = utils.getSetting<boolean>("encounter-import-policy-roll-monster-initiative");
      combatants
        .filter((c: any) => rollMonsterInitiative && c.actor.type === "npc" && c.initiative === null)
        .forEach(async (c: any) => {
          if (c.initiative === null) await combat.rollInitiative(c.id);
        });
    }

    return this.combat;
  }

  async importEncounter({ img, sceneId }: {
    img?: string | null;
    sceneId?: string | null;
  } = {}) {
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
