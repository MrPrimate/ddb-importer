import {
  logger,
  utils,
  Iconizer,
  DDBItemImporter,
  FileHelper,
  CompendiumHelper,
} from "../lib/_module";

interface IDDBMonsterImporterBuildOptions {
  temporary?: boolean;
  update?: boolean;
  addToWorld?: boolean;
  forceImageUpdate?: boolean;
};

type TMonsterImporterMonsterShapes = I5eMonsterData | I5eVehicleData;

type TMonsterImporterMonsterItems = I5eMonsterItem | I5eVehicleItem;

export default class DDBMonsterImporter<T extends TMonsterImporterMonsterShapes = I5eMonsterData> {
  compendiumActor: Actor.Implementation | null;
  itemImporter: DDBItemImporter;
  type: TMonsterImporterTypes;
  fullWipe: boolean;
  updateExisting: boolean;
  monster: T;
  data: Actor.Implementation | null = null;

  constructor({ monster, type, updateExisting, notifier, fullWipe = false }: {
    monster?: T;
    type?: TMonsterImporterTypes;
    updateExisting?: boolean;
    fullWipe?: boolean;
    notifier?: (title: any, { message, isError }: NotifierV1Props) => void;
  } = {}) {
    if (!monster) {
      throw new Error("DDBMonsterImporter requires a monster");
    }
    if (!type) {
      throw new Error("DDBMonsterImporter requires a type");
    }
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
    const compendiumActor = this.compendiumActor;
    if (!compendiumActor) {
      logger.warn("generateCastSpells called without a compendium actor, skipping");
      return;
    }
    const items = compendiumActor.items as unknown as Item.Implementation[];
    for (const item of items) {
      if (!("activities" in item.system)) continue;
      const spells = (
        await Promise.all(
          // TODO: what is the dnd5e activity type here?
          item.system.activities.getByType("cast").map((a: any) => a.getCachedSpellData()),
        )).filter((spell: any) => !(compendiumActor.items as unknown as Item.Implementation[]).find((i) =>
        i.type === "spell" && foundry.utils.hasProperty(i, "flags.dnd5e.cachedFor")
        && i.flags?.dnd5e?.cachedFor === spell.flags?.dnd5e?.cachedFor,
      ));
      if (spells.length) compendiumActor.createEmbeddedDocuments("Item", spells);
    }
  }

  // check items to see if retaining item, img or resources
  async existingItemRetentionCheck(checkId = true) {
    const compendiumActor = this.compendiumActor;
    if (!compendiumActor) {
      logger.warn("existingItemRetentionCheck called without a compendium actor, skipping");
      return;
    }

    const newItems = this.monster.items.map((item) => {
      foundry.utils.setProperty(item, "flags.ddbimporter.parentId", this.monster._id);
      return item;
    });

    const currentItems = compendiumActor.getEmbeddedCollection("Item") as unknown as Item.Implementation[];
    const fiddledItems: any[] = [];

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
        if (foundry.utils.getProperty(existingItem, "flags.ddbimporter.ignoreItemImport")) {
          fiddledItems.push(foundry.utils.duplicate(existingItem));
        } else {
          item["_id"] = existingItem.id ?? undefined;
          if (foundry.utils.getProperty(existingItem, "flags.ddbimporter.ignoreIcon") === true) {
            item.img = existingItem.img;
            foundry.utils.setProperty(item, "flags.ddbimporter.ignoreIcon", true);
          }
          if ("consume" in existingItem.system
            && foundry.utils.getProperty(existingItem, "flags.ddbimporter.retainResourceConsumption")
          ) {
            if ("consume" in item.system) item.system.consume = existingItem.system.consume;
            foundry.utils.setProperty(item, "system.uses.recovery", foundry.utils.getProperty(existingItem, "system.uses.recovery"));
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

    const duplicate: T = foundry.utils.duplicate(this.monster) as unknown as T;
    this.monster = (await this.itemImporter.addCompendiumFolderIds([duplicate]))[0] as T;

    const monsterId = this.monster._id;
    if (monsterId && this.itemImporter.compendium.index.has(monsterId)) {
      if (this.updateExisting) {
        this.compendiumActor = await this.itemImporter.compendium.getDocument(monsterId) as Actor.Implementation;

        if (foundry.utils.hasProperty(this.monster, "prototypeToken.flags.tagger.tags")
          && foundry.utils.hasProperty(this.compendiumActor, "prototypeToken.flags.tagger.tags")
        ) {
          const newTags = [...new Set([
            ...(foundry.utils.getProperty(this.monster, "prototypeToken.flags.tagger.tags") as string[]),
            ...(foundry.utils.getProperty(this.compendiumActor, "prototypeToken.flags.tagger.tags") as string[]),
          ])];
          foundry.utils.setProperty(this.compendiumActor, "prototypeToken.flags.tagger.tags", newTags);
        }

        const existing3dModel: string = foundry.utils.getProperty(this.compendiumActor.prototypeToken, "flags.levels-3d-preview.model3d") as string;
        if (existing3dModel && existing3dModel.trim() !== "") {
          foundry.utils.setProperty(this.monster, "prototypeToken.flags.levels-3d-preview.model3d", existing3dModel);
        }

        if (this.fullWipe) {
          logger.debug("Performing full wipe of existing items/effects");
        } else {
          await this.existingItemRetentionCheck(false);
        }

        if (CONFIG.DDBI.DEV.downloadUpdateJSON) {
          FileHelper.download(JSON.stringify(this.monster), `${this.monster.name}-${this.monster.system.source?.rules ?? ""}.json`, "application/json");
        }
        logger.debug("NPC Update Data", foundry.utils.duplicate(this.monster));
        await this.compendiumActor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
        await this.compendiumActor.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });

        // console.warn("ExistingNPC", { existingNPC: this.compendiumActor.toObject() });
        const items = foundry.utils.deepClone(this.monster.items) as TMonsterImporterMonsterItems[];
        this.monster.items = [];

        const updatedNPC = await this.compendiumActor.update(this.monster as any, {
          pack: this.itemImporter.compendium.collection,
          render: false,
          // keepId: true,
        } as unknown as Parameters<typeof this.compendiumActor.update>[1]);
        // console.warn("UpdatedNPC", { updatedNPC: updatedNPC.toObject(), items });
        if (!updatedNPC) {
          logger.debug("No changes made to base character", this.monster);
        }
        // update() resolves undefined when nothing changed; the items were
        // wiped above so recreate them on the existing compendium actor
        await (updatedNPC ?? this.compendiumActor).createEmbeddedDocuments("Item", items as any, { keepId: true });

        // await existingNPC.createEmbeddedDocuments("Item", items, { keepId: true });
        await this.generateCastSpells();
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
        FileHelper.download(JSON.stringify(this.monster), `${this.monster.name}-${this.monster.system.source?.rules ?? ""}.json`, "application/json");
      }
      this.compendiumActor = await Actor.create(this.monster as any, options) as typeof this.compendiumActor;
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
      && utils.getSetting<boolean>("munching-policy-disable-monster-art")
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

    const protoToken = this.monster.prototypeToken;
    const protoTexture = protoToken?.texture;
    if (!protoToken || !protoTexture) {
      logger.warn(`Monster ${this.monster.name} has no prototype token texture data, skipping image processing`);
      return this.monster;
    }

    const updateImages = utils.getSetting<boolean>("munching-policy-update-images");
    if (!forceUpdate && !updateImages
      && !utils.isDefaultOrPlaceholderImage(this.monster.img)
      && !utils.isDefaultOrPlaceholderImage(protoTexture.src)
    ) {
      return this.monster;
    }

    const isStock = this.monster.flags?.monsterMunch?.isStockImg;
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

    const detailsType = this.monster.system.details?.type;
    const npcType = this.type.startsWith("vehicle")
      ? "vehicle"
      : (typeof detailsType === "object"
        ? (detailsType.value
          ?? (detailsType.custom && detailsType.custom !== "" ? detailsType.custom : "unknown"))
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
        const ext = ddbAvatarUrl.split(".").pop()?.split(/#|\?|&/)[0] ?? "";
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

    const useTokenizer = utils.getSetting<boolean>("munching-policy-monster-tokenize")
      && !disableAutoTokenizeOverride
      && (game.modules.get("vtta-tokenizer")?.active || game.modules.get("tokenizer-2")?.active);

    let monsterTokenImgPath = null;
    let tokenName = null;
    const tokenImgSet = foundry.utils.getProperty(this.monster, "flags.monsterMunch.tokenImgSet");

    if (ddbTokenUrl && tokenImgSet !== true) {
      if (hasTokenProcessedAlready) {
        monsterTokenImgPath = CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.get(ddbTokenUrl);
        protoTexture.src = monsterTokenImgPath;
        if (useWildcard && protoTexture.src?.includes("*")) protoToken.randomImg = true;
      } else {
        const tokenExt = ddbTokenUrl.split(".").pop()?.split(/#|\?|&/)[0] ?? "";
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
        protoTexture.src = monsterTokenImgPath;
        if (monsterTokenImgPath && useWildcard && !useTokenizer) {
          const lastSlashIndex = monsterTokenImgPath.lastIndexOf("/");
          if (lastSlashIndex !== -1) {
            // const postFix = useTokenizer ? `/${name}/*` : "/*";
            // protoTexture.src = monsterTokenImgPath.substring(0, lastSlashIndex + 1) + postFix;
            protoTexture.src = monsterTokenImgPath.substring(0, lastSlashIndex + 1) + "*";
            protoToken.randomImg = true;
          }
        }
      }
    }

    // check avatar, if not use token image
    if (!this.monster.img && protoTexture.src) {
      this.monster.img = monsterTokenImgPath;
    }

    // final check if image comes back as null
    if (this.monster.img === null) {
      this.monster.img = CONFIG.DND5E.defaultArtwork.Actor[this.type] ?? CONFIG.DND5E.defaultArtwork.Actor["npc"];
    }
    if (monsterTokenImgPath === null && tokenImgSet !== true) {
      protoTexture.src = CONFIG.DND5E.defaultArtwork.Actor[this.type]
        ?? CONFIG.DND5E.defaultArtwork.Actor["npc"];
    }

    // do we now want to tokenize that?
    // we don't tokenize if this path was already looked up, as it will already be done
    if (useTokenizer && !hasTokenProcessedAlready && monsterTokenImgPath) {
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

      let tokenizerResult;

      if (game.modules.get("tokenizer-2")?.active) {
        const tokenizer2Api = (game.modules.get("tokenizer-2") as { api?: ITokenizer2API }).api;
        if (tokenizer2Api) {
          const filename = `${tokenizerName}-${bookRuleStub}${compendiumLabel}`;
          const cfg = {
            "saveFolder": targetTokenizerFolder,
            useActorImg: false,
            portraitFit: "contain",
            wildcardMode: "keep",
          };
          const { prototypeToken, layers } = await tokenizer2Api.tokenize(this.monster, {
            ...cfg, filename, updateActor: false,
          });
          foundry.utils.mergeObject(this.monster, foundry.utils.expandObject(prototypeToken));
          foundry.utils.setProperty(this.monster, "flags.tokenizer-2", { layerStack: layers });
        } else {
          logger.warn("tokenizer-2 module is active but exposes no api, skipping tokenize");
        }

      } else if (game.modules.get("vtta-tokenizer")?.active) {

        const autoOptions = {
          name: tokenizerName,
          nameSuffix: `-${bookRuleStub}${compendiumLabel}`,
          updateActor: false,
          isWildCard: false,
          targetFolder: targetTokenizerFolder,
        };
        logger.debug("Tokenizing monster image", { monster: this.monster.name, autoOptions });
        tokenizerResult = await window.Tokenizer.autoToken(this.monster, autoOptions);
        protoTexture.src = tokenizerResult;
      }

      if (useWildcard) {
        protoTexture.src = `${wildcardPath}*`;
        protoToken.randomImg = true;
      }
      logger.debug(`Generated tokenizer image at ${tokenizerResult}`);
    }

    if (!hasAvatarProcessedAlready) CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.set(ddbAvatarUrl, this.monster.img);
    if (!hasTokenProcessedAlready) CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.set(ddbTokenUrl, protoTexture.src);

    return this.monster;
  }

  async build({
    temporary = true, update = false, addToWorld = false,
    forceImageUpdate = undefined,
  }: IDDBMonsterImporterBuildOptions = {}) {
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
    }) as unknown as TMonsterImporterMonsterItems[]; // we know these are all the correct item type as they are passed in here
    this.monster = Iconizer.addActorEffectIcons(this.monster);

    if (!addToWorld) return;

    // create the new npc
    logger.debug("Creating NPC actor");
    if (update) {
      if (!this.monster._id) {
        throw new Error(`Unable to update world actor for ${this.monster.name}: monster has no _id`);
      }
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

  static async addNPC(
    data: I5eMonsterData | I5eVehicleData,
    type: TMonsterImporterTypes,
    buildOptions: IDDBMonsterImporterBuildOptions = {},
    { updateExisting = null, fullWipe = null }: { updateExisting?: boolean | null; fullWipe?: boolean | null } = {},
  ) {
    try {
      const monsterImporter = new DDBMonsterImporter<typeof data>({
        monster: data,
        type,
        updateExisting: updateExisting ?? undefined,
        fullWipe: fullWipe ?? undefined,
      });
      await monsterImporter.build(buildOptions);
      logger.info(`Processing ${type} ${monsterImporter.monster.name} for the compendium`);
      await monsterImporter.addToCompendium();
      return monsterImporter.compendiumActor;
    } catch (error) {
      logger.error(`error parsing NPC type ${type}: ${error} ${data.name}`);
      if (error instanceof Error) logger.error(error.stack);
      throw error;
    }

  }

}
