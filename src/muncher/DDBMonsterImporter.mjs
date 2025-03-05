import {
  logger,
  utils,
  Iconizer,
  DDBItemImporter,
  FileHelper,
  CompendiumHelper,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";

export default class DDBMonsterImporter {

  constructor({ monster, type, updateExisting } = {}) {
    this.monster = monster;
    this.type = type;
    this.updataExisting = updateExisting ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");

    this.compendiumActor = null;


    this.itemImporter = new DDBItemImporter(type, [], {
      notifier: utils.munchNote,
    });
  }


  // this generates any missing spell data for actors
  // it wont appear in the compendium but will upon import
  async generateCastSpells() {
    // if (foundry.utils.isNewerVersion(game.system.version, "4.3.3")) return;
    for (const item of this.compendiumActor.items) {
      if (!item.system.activities) continue;
      const spells = (
        await Promise.all(
          item.system.activities.getByType("cast").map((a) => a.getCachedSpellData()),
        )).filter((spell) => !this.compendiumActor.items.find((i) =>
        i.type === "spell" && foundry.utils.hasProperty(i, "flags.dnd5e.cachedFor")
        && i.flags?.dnd5e?.cachedFor === spell.flags?.dnd5e?.cachedFor,
      ));
      if (spells.length) this.compendiumActor.createEmbeddedDocuments("Item", spells);
    }
  }

  // check items to see if retaining item, img or resources
  async existingItemRetentionCheck(checkId = true) {

    const newItems = this.monster.items.map((item) => {
      foundry.utils.setProperty(item, "flags.ddbimporter.parentId", this.monster._id);
      return item;
    });

    const currentItems = this.compendiumActor.getEmbeddedCollection("Item");
    const fiddledItems = [];

    await newItems.forEach((item) => {
      const existingItem = currentItems.find((owned) => {
        const simpleMatch
          = item.name === owned.name
          && item.type === owned.type
          // && item.system.activation?.type === owned.system.activation?.type
          && ((checkId && item.flags?.ddbimporter?.id === owned.flags?.ddbimporter?.id) || !checkId);

        return simpleMatch;
      });

      if (existingItem) {
        if (existingItem.flags.ddbimporter?.ignoreItemImport) {
          fiddledItems.push(foundry.utils.duplicate(existingItem));
        } else {
          item["_id"] = existingItem.id;
          if (foundry.utils.getProperty(existingItem, "flags.ddbimporter.ignoreIcon") === true) {
            item.img = existingItem.img;
            foundry.utils.setProperty(item, "flags.ddbimporter.ignoreIcon", true);
          }
          if (foundry.utils.getProperty(existingItem, "flags.ddbimporter.retainResourceConsumption")) {
            item.system.consume = existingItem.system.consume;
            item.system.uses.recovery = existingItem.system.uses.recovery;
            foundry.utils.setProperty(item, "flags.ddbimporter.retainResourceConsumption", true);
            if (foundry.utils.hasProperty(existingItem, "flags.link-item-resource-5e")) {
              foundry.utils.setProperty(item, "flags.link-item-resource-5e", existingItem.flags["link-item-resource-5e"]);
            }
          }

          if (!item.effects
            || (item.effects && item.effects.length == 0 && existingItem.effects && existingItem.effects.length > 0)
          ) {
            item.effects = foundry.utils.duplicate(existingItem.getEmbeddedCollection("ActiveEffect"));
          }

          fiddledItems.push(item);
        }
      } else {
        fiddledItems.push(item);
      }
    });

    logger.debug("Finished retaining items");
    this.monster.items = fiddledItems;
  }

  async addToCompendium() {
    if (!this.itemImporter.compendium) {
      logger.error("Error opening compendium, check your settings");
      return;
    }

    this.monster = (await this.itemImporter.addCompendiumFolderIds([foundry.utils.duplicate(this.monster)]))[0];

    if (foundry.utils.hasProperty(this.monster, "_id") && this.itemImporter.compendium.index.has(this.monster._id)) {
      if (this.updataExisting) {
        this.compendiumActor = await this.itemImporter.compendium.getDocument(this.monster._id);

        if (foundry.utils.hasProperty(this.monster, "prototypeToken.flags.tagger.tags")
          && foundry.utils.hasProperty(this.compendiumActor, "prototypeToken.flags.tagger.tags")
        ) {
          const newTags = [...new Set(this.monster.prototypeToken.flags.tagger.tags, this.compendiumActor.prototypeToken.flags.tagger.tags)];
          foundry.utils.setProperty(this.compendiumActor, "prototypeToken.flags.tagger.tags", newTags);
        }

        const existing3dModel = foundry.utils.getProperty(this.compendiumActor.prototypeToken, "flags.levels-3d-preview.model3d");
        if (existing3dModel && existing3dModel.trim() !== "") {
          foundry.utils.setProperty(this.monster.prototypeToken, "flags.levels-3d-preview.model3d", existing3dModel);
        }

        await this.existingItemRetentionCheck(false);

        logger.debug("NPC Update Data", foundry.utils.duplicate(this.monster));
        await this.compendiumActor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
        await this.compendiumActor.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });

        // console.warn("ExistingNPC", { existingNPC: this.compendiumActor.toObject() });

        const updatedNPC = await this.compendiumActor.update(this.monster, { pack: this.itemImporter.compendium.collection, render: false, keepId: true });
        // await existingNPC.createEmbeddedDocuments("Item", items, { keepId: true });
        await this.generateCastSpells();
        if (!updatedNPC) {
          logger.debug("No changes made to base character", this.monster);
        }
      }
    } else {
      // create the new npc
      logger.debug(`Creating NPC actor ${this.monster.name}`);
      const options = {
        displaySheet: false,
        pack: this.itemImporter.compendium.collection,
        keepId: true,
      };
      logger.debug("NPC New Data", foundry.utils.duplicate(this.monster));
      this.compendiumActor = await Actor.create(this.monster, options);
      await this.generateCastSpells();
    }

  }


  // eslint-disable-next-line complexity, no-unused-vars
  async getNPCImage({
    forceUpdate = false, forceUseFullToken = false,
    forceUseTokenAvatar = false, disableAutoTokenizeOverride = false,
  } = {},
  ) {
    logger.verbose("getNPCImage", {
      name: this.monster.name,
    });
    // check to see if we have munched flags to work on
    if (!foundry.utils.hasProperty(this.monster, "flags.monsterMunch.img")) {
      return this.monster;
    }

    const updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
    if (!forceUpdate && !updateImages && this.monster.img !== CONST.DEFAULT_TOKEN) {
      return this.monster;
    }

    const isStock = this.monster.flags.monsterMunch.isStockImg;
    const useAvatarAsToken = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-full-token-image") || forceUseFullToken;
    const useTokenAsAvatar = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-token-avatar-image") || forceUseTokenAvatar;

    let ddbAvatarUrl = useTokenAsAvatar
      ? foundry.utils.getProperty(this.monster, "flags.monsterMunch.tokenImg")
      : foundry.utils.getProperty(this.monster, "flags.monsterMunch.img");
    let ddbTokenUrl = useAvatarAsToken
      ? foundry.utils.getProperty(this.monster, "flags.monsterMunch.img")
      : foundry.utils.getProperty(this.monster, "flags.monsterMunch.tokenImg");

    if (!ddbAvatarUrl && ddbTokenUrl) ddbAvatarUrl = ddbTokenUrl;
    if (!ddbTokenUrl && ddbAvatarUrl) ddbTokenUrl = ddbAvatarUrl;

    const hasAvatarProcessedAlready = CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.get(ddbAvatarUrl);
    const hasTokenProcessedAlready = CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.get(ddbTokenUrl);

    const npcType = this.type.startsWith("vehicle")
      ? "vehicle"
      : this.monster.system.details.type.value
        ?? (this.monster.system.details.type.custom && this.monster.system.details.type.custom !== ""
          ? this.monster.system.details.type.custom
          : "unknown");
    const genericNPCName = utils.referenceNameString(npcType);
    const npcName = utils.referenceNameString(this.monster.name);

    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const subType = foundry.utils.getProperty(this.monster, "system.details.type.value") ?? "other";
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

    const rules = this.monster.system.source?.rules ?? "2024";
    const book = utils.normalizeString(this.monster.system.source?.book ?? "");
    const bookRuleStub = [rules, book].join("-");

    if (ddbAvatarUrl && foundry.utils.getProperty(this.monster, "flags.monsterMunch.imgSet") !== true) {
      if (hasAvatarProcessedAlready) {
        this.monster.img = CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.get(ddbAvatarUrl);
      } else {
        const ext = ddbAvatarUrl.split(".").pop().split(/#|\?|&/)[0];
        const genericNpc = ddbAvatarUrl.endsWith(npcType + "." + ext) || isStock;
        const name = genericNpc ? genericNPCName : npcName;
        const nameType = genericNpc ? "npc-generic" : "npc";
        const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-${nameType}`;
        // const imageNamePrefix = useDeepPaths ? "" : nameType;
        const pathPostfix = useDeepPaths ? `/monster/avatar/${subType}` : "";
        const downloadOptions = { type: nameType, name, targetDirectory, pathPostfix, imageNamePrefix, force: forceUpdate || updateImages };
        // eslint-disable-next-line require-atomic-updates
        this.monster.img = await FileHelper.getImagePath(ddbAvatarUrl, downloadOptions);
      }
    }


    if (ddbTokenUrl && foundry.utils.getProperty(this.monster, "flags.monsterMunch.tokenImgSet") !== true) {
      if (hasTokenProcessedAlready) {
        this.monster.prototypeToken.texture.src = CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.get(ddbTokenUrl);
      } else {
        const tokenExt = ddbTokenUrl.split(".").pop().split(/#|\?|&/)[0];
        const genericNpc = ddbTokenUrl.endsWith(npcType + "." + tokenExt) || isStock;
        const name = genericNpc ? genericNPCName : npcName;
        const nameType = genericNpc ? "npc-generic-token" : "npc-token";
        const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-${nameType}`;
        // const imageNamePrefix = useDeepPaths ? "" : nameType;
        const pathPostfix = useDeepPaths ? `/monster/token/${subType}` : "";
        // Token images always have to be downloaded.
        const downloadOptions = {
          type: nameType,
          name, download: true,
          remoteImages: false,
          force: forceUpdate || updateImages,
          imageNamePrefix,
          pathPostfix,
          targetDirectory,
        };
        // eslint-disable-next-line require-atomic-updates
        this.monster.prototypeToken.texture.src = await FileHelper.getImagePath(ddbTokenUrl, downloadOptions);
      }
    }

    // check avatar, if not use token image
    // eslint-disable-next-line require-atomic-updates
    if (!this.monster.img && this.monster.prototypeToken.texture.src) this.monster.img = this.monster.prototypeToken.texture.src;

    // final check if image comes back as null
    // eslint-disable-next-line require-atomic-updates
    if (this.monster.img === null) this.monster.img = CONST.DEFAULT_TOKEN;
    // eslint-disable-next-line require-atomic-updates
    if (this.monster.prototypeToken.texture.src === null) this.monster.prototypeToken.texture.src = CONST.DEFAULT_TOKEN;

    // do we now want to tokenize that?
    const useTokenizer = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-tokenize")
      && !disableAutoTokenizeOverride
      && game.modules.get("vtta-tokenizer")?.active;
    // we don't tokenize if this path was already looked up, as it will already be done
    if (useTokenizer && !hasTokenProcessedAlready) {
      const compendiumLabel = CompendiumHelper.getCompendiumLabel(this.type);
      const tokenizerName = isStock
        ? npcType
        : this.monster.name;
      const autoOptions = { name: tokenizerName, nameSuffix: `-${bookRuleStub}${compendiumLabel}`, updateActor: false };
      // eslint-disable-next-line require-atomic-updates
      this.monster.prototypeToken.texture.src = await window.Tokenizer.autoToken(this.monster, autoOptions);
      logger.debug(`Generated tokenizer image at ${this.monster.prototypeToken.texture.src}`);
    }

    if (!hasAvatarProcessedAlready) CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.set(ddbAvatarUrl, this.monster.img);
    if (!hasTokenProcessedAlready) CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.set(ddbTokenUrl, this.monster.prototypeToken.texture.src);

    return this.monster;
  }

  async build({
    temporary = true, update = false, addToWorld = false,
    forceImageUpdate = undefined,
  } = {}) {
    logger.debug("Importing Images");
    await this.getNPCImage({ forceUpdate: forceImageUpdate });
    logger.debug("Checking Items");
    // await swapItems(this.monster);

    logger.debug("Importing Icons");
    // eslint-disable-next-line require-atomic-updates
    this.monster.items = await Iconizer.updateIcons({
      documents: this.monster.items,
      srdIconUpdate: false,
      monster: true,
      monsterName: this.monster.name,
    });
    this.monster = Iconizer.addActorEffectIcons(this.monster);

    if (!addToWorld) return;

    // create the new npc
    logger.debug("Creating NPC actor");
    if (update) {
      const npc = game.actors.get(this.monster._id);
      await npc.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
      await Actor.updateDocuments([this.monster]);
      this.data = npc;
    } else {
      const options = {
        displaySheet: false,
      };
      if (temporary) options.temporary = true;
      const npc = temporary
        ? new Actor.implementation(this.monster, options)
        : await Actor.create(this.monster, options);
      this.data = npc;
    }

  }


  static async addNPC(data, type, buildOptions = {}, { updateExisting = null } = {}) {
    try {
      const monsterImporter = new DDBMonsterImporter({
        monster: data,
        type,
        updateExisting,
      });
      await monsterImporter.build(buildOptions);
      logger.info(`Processing ${type} ${monsterImporter.monster.name} for the compendium`);
      await monsterImporter.addToCompendium();
      return this.compendiumActor;
    } catch (error) {
      logger.error(`error parsing NPC type ${type}: ${error} ${data.name}`);
      logger.error(error.stack);
      throw error;
    }

  }

}
