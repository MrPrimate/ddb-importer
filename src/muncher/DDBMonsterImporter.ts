import {
  logger,
  utils,
  Iconizer,
  DDBItemImporter,
  FileHelper,
  CompendiumHelper,
} from "../lib/_module";
import { SETTINGS } from "../config/_module";

interface IDDBMonsterImporter {
  monster?: I5eMonsterData;
  type?: string;
  updateExisting?: boolean;
  fullWipe?: boolean;
  notifier?: (title: any, { message, isError }: NotifierV1Props) => void;
}

export default class DDBMonsterImporter {
  compendiumActor: Actor.Implementation | null;
  itemImporter: DDBItemImporter;
  type: string;
  fullWipe: boolean;
  updateExisting: boolean;
  monster: I5eMonsterData;
  data: Actor.Implementation | null;

  constructor({ monster, type, updateExisting, notifier, fullWipe = false }: IDDBMonsterImporter = {}) {
    this.monster = monster;
    this.type = type;
    this.fullWipe = fullWipe;
    this.updateExisting = updateExisting ?? utils.getSetting<boolean>("munching-policy-update-existing");

    this.compendiumActor = null;


    this.itemImporter = new DDBItemImporter(type, [], {
      notifier: notifier ?? utils.munchNote,
    });
  }


  // this generates any missing spell data for actors
  // it wont appear in the compendium but will upon import
  async generateCastSpells() {
    const items = this.compendiumActor.items as unknown as Item.Implementation[];
    for (const item of items) {
      if (!("activities" in item.system)) continue;
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

    const currentItems = this.compendiumActor.getEmbeddedCollection("Item") as unknown as Item.Implementation[];
    const fiddledItems = [];

    await newItems.forEach((item) => {
      const existingItem = currentItems.find((owned) => {
        const simpleMatch
          = item.name === owned.name
          && item.type === owned.type
          // && item.system.activation?.type === owned.system.activation?.type
          && ((checkId
            && foundry.utils.getProperty(item, "flags.ddbimporter.id") === foundry.utils.getProperty(owned, "flags.ddbimporter.id")
          ) || !checkId);

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
            if ("consume" in item.system) item.system.consume = existingItem.system.consume;
            item.system.uses.recovery = existingItem.system.uses.recovery;
            foundry.utils.setProperty(item, "flags.ddbimporter.retainResourceConsumption", true);
            if (foundry.utils.hasProperty(existingItem, "flags.link-item-resource-5e")) {
              foundry.utils.setProperty(item, "flags.link-item-resource-5e", existingItem.flags["link-item-resource-5e"]);
            }
          }

          if (!item.effects
            || (item.effects && item.effects.length == 0 && existingItem.effects && existingItem.effects.size > 0)
          ) {
            item.effects = foundry.utils.duplicate(existingItem.getEmbeddedCollection("ActiveEffect")) as unknown as I5eEffectData[];
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

    const duplicate: I5eMonsterData = foundry.utils.duplicate(this.monster) as unknown as I5eMonsterData;
    this.monster = (await this.itemImporter.addCompendiumFolderIds([duplicate]))[0] as I5eMonsterData;

    if (foundry.utils.hasProperty(this.monster, "_id") && this.itemImporter.compendium.index.has(this.monster._id)) {
      if (this.updateExisting) {
        this.compendiumActor = await this.itemImporter.compendium.getDocument(this.monster._id) as Actor.Implementation;

        if (foundry.utils.hasProperty(this.monster, "prototypeToken.flags.tagger.tags")
          && foundry.utils.hasProperty(this.compendiumActor, "prototypeToken.flags.tagger.tags")
        ) {
          const newTags = [...new Set([
            // @ts-expect-error this is an array
            ...this.monster.prototypeToken.flags.tagger.tags,
            // @ts-expect-error this is an array
            ...this.compendiumActor.prototypeToken.flags.tagger.tags,
          ])];
          foundry.utils.setProperty(this.compendiumActor, "prototypeToken.flags.tagger.tags", newTags);
        }

        const existing3dModel: string = foundry.utils.getProperty(this.compendiumActor.prototypeToken, "flags.levels-3d-preview.model3d") as string;
        if (existing3dModel && existing3dModel.trim() !== "") {
          foundry.utils.setProperty(this.monster.prototypeToken, "flags.levels-3d-preview.model3d", existing3dModel);
        }

        if (this.fullWipe) {
          logger.debug("Performing full wipe of existing items/effects");
        } else {
          await this.existingItemRetentionCheck(false);
        }

        if (CONFIG.DDBI.DEV.downloadUpdateJSON) {
          FileHelper.download(JSON.stringify(this.monster), `${this.monster.name}-${this.monster.system.source.rules}.json`, "application/json");
        }
        logger.debug("NPC Update Data", foundry.utils.duplicate(this.monster));
        await this.compendiumActor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
        await this.compendiumActor.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });

        // console.warn("ExistingNPC", { existingNPC: this.compendiumActor.toObject() });
        const items = foundry.utils.deepClone(this.monster.items) as I5eMonsterItem[];
        this.monster.items = [];

        const updatedNPC = await this.compendiumActor.update(this.monster as any, {
          pack: this.itemImporter.compendium.collection,
          render: false,
          // keepId: true,
        });
        // console.warn("UpdatedNPC", { updatedNPC: updatedNPC.toObject(), items });
        await updatedNPC.createEmbeddedDocuments("Item", items as any, { keepId: true });

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
      if (CONFIG.DDBI.DEV.downloadUpdateJSON) {
        FileHelper.download(JSON.stringify(this.monster), `${this.monster.name}-${this.monster.system.source.rules}.json`, "application/json");
      }
      this.compendiumActor = await Actor.create(this.monster as any, options);
      await this.generateCastSpells();
    }

    await Hooks.callAll("ddb-importer.monsterAddToCompendiumComplete", { actor: this.compendiumActor });

  }


  async getNPCImage({
    forceUpdate = false, forceUseFullToken = false,
    forceUseTokenAvatar = false, disableAutoTokenizeOverride = false,
    ignoreDisableArtSetting = false,
  } = {},
  ) {
    if (!ignoreDisableArtSetting
      && game.settings.get(SETTINGS.MODULE_ID, "munching-policy-disable-monster-art")
    ) {
      logger.debug(`Monster art disabled by setting, skipping image processing for ${this.monster.name}`);
      return this.monster;
    }
    logger.verbose("getNPCImage", {
      name: this.monster.name,
    });
    // check to see if we have munched flags to work on
    if (!foundry.utils.hasProperty(this.monster, "flags.monsterMunch.img")) {
      return this.monster;
    }

    const updateImages = utils.getSetting<boolean>("munching-policy-update-images");
    if (!forceUpdate && !updateImages && !utils.isDefaultOrPlaceholderImage(this.monster.img)) {
      return this.monster;
    }

    const isStock = this.monster.flags.monsterMunch.isStockImg;
    const useAvatarAsToken = utils.getSetting<boolean>("munching-policy-use-full-token-image") || forceUseFullToken;
    const useTokenAsAvatar = utils.getSetting<boolean>("munching-policy-use-token-avatar-image") || forceUseTokenAvatar;

    let ddbAvatarUrl: string = useTokenAsAvatar
      ? foundry.utils.getProperty(this.monster, "flags.monsterMunch.tokenImg") as string
      : foundry.utils.getProperty(this.monster, "flags.monsterMunch.img") as string;
    let ddbTokenUrl: string = useAvatarAsToken
      ? foundry.utils.getProperty(this.monster, "flags.monsterMunch.img") as string
      : foundry.utils.getProperty(this.monster, "flags.monsterMunch.tokenImg") as string;

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

    const targetDirectory = utils.getSetting<string>("other-image-upload-directory").replace(/^\/|\/$/g, "");
    const subType: string = foundry.utils.getProperty(this.monster, "system.details.type.value") as string ?? "other";
    const useWildcard = utils.getSetting<boolean>("munching-policy-monster-wildcard");
    const useDeepPaths = useWildcard || utils.getSetting<boolean>("use-deep-file-paths");

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
        const downloadOptions = {
          type: nameType,
          name,
          targetDirectory,
          pathPostfix,
          imageNamePrefix,
          force: forceUpdate || updateImages,
        };
        this.monster.img = await FileHelper.getImagePath(ddbAvatarUrl, downloadOptions);
      }
    }

    const useTokenizer = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-tokenize")
      && !disableAutoTokenizeOverride
      && game.modules.get("vtta-tokenizer")?.active;

    let monsterTokenImgPath = null;
    let tokenName = null;
    const tokenImgSet = foundry.utils.getProperty(this.monster, "flags.monsterMunch.tokenImgSet");
    if (ddbTokenUrl && tokenImgSet !== true) {
      if (hasTokenProcessedAlready) {
        this.monster.prototypeToken.texture.src = CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.get(ddbTokenUrl);
        if (useWildcard && this.monster.prototypeToken.texture.src.includes("*")) this.monster.prototypeToken.randomImg = true;
      } else {
        const tokenExt = ddbTokenUrl.split(".").pop().split(/#|\?|&/)[0];
        const genericNpc = ddbTokenUrl.endsWith(npcType + "." + tokenExt) || isStock;
        const name = genericNpc ? genericNPCName : npcName;
        tokenName = name;
        const nameType = genericNpc ? "npc-generic-token" : "npc-token";
        const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-${nameType}`;
        const pathPostfix = useDeepPaths
          ? useWildcard && !useTokenizer
            ? `/monster/token/${subType}/${name}`
            : `/monster/token/${subType}`
          : "";
        // Token images always have to be downloaded.
        const downloadOptions = {
          type: nameType,
          name,
          download: true,
          remoteImages: false,
          force: forceUpdate || updateImages,
          imageNamePrefix,
          pathPostfix,
          targetDirectory,
        };
        monsterTokenImgPath = await FileHelper.getImagePath(ddbTokenUrl, downloadOptions);
        this.monster.prototypeToken.texture.src = monsterTokenImgPath;
        if (monsterTokenImgPath && useWildcard && !useTokenizer) {
          const lastSlashIndex = monsterTokenImgPath.lastIndexOf("/");
          if (lastSlashIndex !== -1) {
            // const postFix = useTokenizer ? `/${name}/*` : "/*";
            // this.monster.prototypeToken.texture.src = monsterTokenImgPath.substring(0, lastSlashIndex + 1) + postFix;
            this.monster.prototypeToken.texture.src = monsterTokenImgPath.substring(0, lastSlashIndex + 1) + "*";
            this.monster.prototypeToken.randomImg = true;
          }
        }
      }
    }

    // check avatar, if not use token image
    if (!this.monster.img && this.monster.prototypeToken.texture.src) {
      this.monster.img = monsterTokenImgPath;
    }

    // final check if image comes back as null
    if (this.monster.img === null) {
      this.monster.img = CONFIG.DND5E.defaultArtwork.Actor[this.type] ?? CONFIG.DND5E.defaultArtwork.Actor["npc"];
    }
    if (monsterTokenImgPath === null && tokenImgSet !== true) {
      this.monster.prototypeToken.texture.src = CONFIG.DND5E.defaultArtwork.Actor[this.type]
        ?? CONFIG.DND5E.defaultArtwork.Actor["npc"];
    }

    // do we now want to tokenize that?
    // we don't tokenize if this path was already looked up, as it will already be done
    if (useTokenizer && !hasTokenProcessedAlready) {
      const compendiumLabel = useWildcard ? "" : CompendiumHelper.getCompendiumLabel(this.type);
      const tokenizerName = isStock
        ? npcType
        : this.monster.name;

      const lastSlashIndex = monsterTokenImgPath.lastIndexOf("/");
      let targetTokenizerFolder = null;
      const wildcardPath = monsterTokenImgPath.substring(0, lastSlashIndex + 1) + `${tokenName}/`;
      if (useWildcard) {
        const parsed = FileHelper.parseDirectory(targetDirectory);
        if (parsed.activeSource === "s3") {
          const parsedS3Url = foundry.utils.parseS3URL(wildcardPath);
          targetTokenizerFolder = `${targetDirectory}/${parsedS3Url.keyPrefix.replace(parsed.current, "")}`;
        } else {
          targetTokenizerFolder = wildcardPath;
        }
        parsed.fullPath = parsed.fullPath.replace(parsed.current, targetTokenizerFolder);
        parsed.current = targetTokenizerFolder;
        logger.verbose(`Verifying wildcard tokenizer folder at ${targetTokenizerFolder}`, {
          targetDirectory,
          wildcardPath,
          parsed,
        });
        await FileHelper.verifyDirectory(parsed);
      }

      const autoOptions = {
        name: tokenizerName,
        nameSuffix: `-${bookRuleStub}${compendiumLabel}`,
        updateActor: false,
        isWildCard: false,
        targetFolder: targetTokenizerFolder,
      };
      logger.debug("Tokenizing monster image", { monster: this.monster.name, autoOptions });
      const tokenizerResult = await window.Tokenizer.autoToken(this.monster, autoOptions);
      this.monster.prototypeToken.texture.src = tokenizerResult;
      if (useWildcard) {
        this.monster.prototypeToken.texture.src = `${wildcardPath}*`;
        this.monster.prototypeToken.randomImg = true;
      }
      logger.debug(`Generated tokenizer image at ${tokenizerResult}`);
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
    this.monster.items = await Iconizer.updateIcons({
      documents: this.monster.items,
      srdIconUpdate: utils.getSetting<boolean>("munching-policy-use-srd-icons"), // "munching-policy-use-srd-monster-images"
      monster: true,
      monsterName: this.monster.name,
    }) as unknown as I5eMonsterItem[]; // we know these are all the correct item type as they are passed in here
    this.monster = Iconizer.addActorEffectIcons(this.monster);

    if (!addToWorld) return;

    // create the new npc
    logger.debug("Creating NPC actor");
    if (update) {
      const npc = game.actors.get(this.monster._id);
      await npc.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
      await Actor.updateDocuments([this.monster as any]);
      this.data = npc as Actor.Implementation;
    } else {
      const options = {
        displaySheet: false,
        temporary: false, // default
      };
      if (temporary) options.temporary = true;
      const npc = temporary
        ? new (Actor.implementation as any)(this.monster, options)
        : await Actor.create(this.monster as any, options);
      this.data = npc as Actor.Implementation;
    }

  }


  static async addNPC(data, type, buildOptions = {}, { updateExisting = null, fullWipe = null } = {}) {
    try {
      const monsterImporter = new DDBMonsterImporter({
        monster: data,
        type,
        updateExisting,
        fullWipe,
      });
      await monsterImporter.build(buildOptions);
      logger.info(`Processing ${type} ${monsterImporter.monster.name} for the compendium`);
      await monsterImporter.addToCompendium();
      return monsterImporter.compendiumActor;
    } catch (error) {
      logger.error(`error parsing NPC type ${type}: ${error} ${data.name}`);
      logger.error(error.stack);
      throw error;
    }

  }

}
