import DDBMuncher from "../apps/DDBMuncher";
import { DICTIONARY } from "../config/_module";
import { DDBCampaigns, DDBProxy, FileHelper, FolderHelper, logger, PatreonHelper, Secrets, utils } from "../lib/_module";
import DDBCharacter from "../parser/DDBCharacter";
import CharacterFeatureFactory from "../parser/features/CharacterFeatureFactory";
import DDBClass from "../parser/classes/DDBClass";
import DDBRace from "../parser/race/DDBRace";
import { DDBReferenceLinker } from "../parser/lib/_module";
import DDBCharacterImporter from "./DDBCharacterImporter";

interface IDDBMuleHandlerQuickBase {
  characterId: string;
  sources: number[];
  homebrew: boolean;
  filterIds: number[];
}

interface IDDBMuleHandlerQuickClass extends IDDBMuleHandlerQuickBase {
  classId: string;
  cleanup?: boolean;
}

interface IDDBMuleHandlerQuickClassList extends IDDBMuleHandlerQuickBase {
  classIds: string[];
  cleanup?: boolean;
}

interface IDDBGetSubClasses {
  className: string;
  rulesVersion?: string;
  includeHomebrew?: boolean;
  campaignId?: string | null;
}

interface IDDBMuleRequestBody {
  cobalt: string;
  betaKey: string;
  characterId: string | null;
  campaignId: string | null;
  filterModifiers: boolean;
  splitSpells: boolean;
  sources: number[];
  includeHomebrew: boolean;
  onlyHomebrew: boolean;
  filterIds: number[];
  cleanup: boolean;
  backgroundId: string | null;
}

interface DDBMuleHandlerOptions {
  characterId: string | null;
  classId?: string | null;
  sources?: number[];
  homebrew?: boolean;
  onlyHomebrew?: boolean;
  type?: string | null;
  filterIds?: number[];
  cleanup?: boolean;
  backgroundId?: string | null;
  ddbMuncher?: DDBMuncher | null;
  attempts?: number;
}

export default class DDBMuleHandler {

  static LOADING_MESSAGES = DICTIONARY.messages.loading;
  characterId: string | null = null;
  classId: string | null = null;
  source: IDDBMuleClassSource;
  allowedSourceIds: number[] = [];
  allowedHomebrew = false;
  onlyHomebrew = false;
  type: string | null = null;
  filterIds: number[] = [];
  cleanup = true;
  backgroundId: string | null = null;
  ddbMuncher: DDBMuncher | null = null;
  folder: string | null = null;
  attempts = 5;
  pendingDocs: {
    features: Map<string, any>;
    traits: Map<string, any>;
    feats: Map<string, any>;
    backgrounds: Map<string, any>;
    species: Map<string, any>;
    classMeta: Map<string, { name: string; version: string; subclassName: string | null }>;
    raceFolderSources: Map<string, any>;
    classes: Map<string, { data: any; className: string; name: string; versionStub: string }>;
    subclasses: Map<string, { data: any; className: string; name: string; versionStub: string }>;
  } = {
    features: new Map(),
    traits: new Map(),
    feats: new Map(),
    backgrounds: new Map(),
    species: new Map(),
    classMeta: new Map(),
    raceFolderSources: new Map(),
    classes: new Map(),
    subclasses: new Map(),
  };

  cachedClassCharacters: DDBCharacter[] = [];

  constructor({
    characterId,
    classId,
    sources = [1, 2, 148, 145],
    homebrew = false,
    onlyHomebrew,
    type = null,
    filterIds = [],
    cleanup = true,
    backgroundId = null,
    ddbMuncher = null,
    attempts = null,
  }: DDBMuleHandlerOptions) {
    if (!characterId) {
      throw new Error("characterId is required");
    }
    if (!type) {
      throw new Error("type is required");
    }
    this.characterId = characterId;
    this.classId = classId;
    this.allowedSourceIds = sources;
    this.allowedHomebrew = homebrew;
    this.onlyHomebrew = onlyHomebrew ?? this.allowedHomebrew;
    this.type = type;
    this.filterIds = filterIds;
    this.cleanup = cleanup;
    this.backgroundId = backgroundId;
    if (attempts) {
      this.attempts = attempts;
    }
    foundry.utils.setProperty(CONFIG, `DDB.MULE.${this.type}`, this);
    this.ddbMuncher = ddbMuncher;
  }


  async _init() {
    await DDBReferenceLinker.importCacheLoad();
    await this._fetchMuleData();
    if (CONFIG.DDBI.DEV.downloadFinalActorJSON) {
      const folder = await FolderHelper.getOrCreateFolder(null, "Actor", "Mule");
      this.folder = folder.id;
    }
  }

  async _loadCharacterIntoFoundryWorld(ddbCharacter: DDBCharacter) {
    if (!CONFIG.DDBI.DEV.downloadFinalActorJSON) return;
    try {
      const characterData = {
        name: "New Actor",
        type: "character",
        folder: this.folder,
        flags: {
          ddbimporter: {
            dndbeyond: {
              characterId: this.characterId,
              url: `https://www.dndbeyond.com/characters/${this.characterId}`,
            },
          },
        },
      };
      // @ts-expect-error - 5e types error - wants more fields, but not needed
      const actor: Actor.Implementation = await Actor.create(characterData) as Actor.Implementation;
      const actorData = actor.toObject();
      ddbCharacter.currentActor = actor;
      const importer = new DDBCharacterImporter({
        actorId: actorData._id,
        ddbCharacter,
      });
      await importer.processCharacterData();
    } catch (error) {
      switch (error.message) {
        case "ImportFailure":
          logger.error("Failure");
          logger.error(error.stack);
          break;
        case "Forbidden":
          logger.error("Error retrieving Character: ", error);
          logger.error(error.stack);
          break;
        default:
          logger.error("Error processing Character: ", error);
          logger.error(error.stack);
          break;
      }
    }
  }

  static #docKey(doc: any, type: "features" | "traits" | "feats" | "backgrounds"): string {
    const flags = (foundry.utils.getProperty(doc, "flags.ddbimporter") ?? {}) as IDDBImporterFlags;
    const id = flags.id ?? doc._id ?? doc.name;
    const is2014 = flags.is2014 ?? true;
    const ddbType = flags.type ?? "";
    // Choice features (e.g. warlock invocations, fighting styles) all share
    // the parent feature's ddbDefinition.id; they are only distinguished by
    // the rewritten document name. Always include the name so distinct
    // choices are not collapsed together by the dedup map.
    const name = doc.name ?? "";
    if (type === "traits") {
      const groupName = flags.groupName ?? "";
      const isLineage = flags.isLineage ?? false;
      return `${ddbType}|${id}|${name}|${groupName}|${isLineage}|${is2014}`;
    }
    return `${ddbType}|${id}|${name}|${is2014}`;
  }

  #mergePendingDocs(ddbCharacter: DDBCharacter) {
    const pending = ddbCharacter._characterFeatureFactory.pendingCompendiumDocuments;
    for (const type of ["features", "traits", "feats", "backgrounds"] as const) {
      for (const doc of pending[type]) {
        const key = DDBMuleHandler.#docKey(doc, type);
        this.pendingDocs[type].set(key, doc);
      }
    }
    for (const meta of pending.classMeta) {
      const key = `${meta.name}|${meta.version}|${meta.subclassName ?? ""}`;
      this.pendingDocs.classMeta.set(key, meta);
    }
    for (const source of pending.raceFolderSources) {
      if (!source) continue;
      const flags = (foundry.utils.getProperty(source, "flags.ddbimporter") ?? {}) as IDDBImporterFlags;
      const key = `${flags.id ?? source._id ?? source.name ?? ""}|${flags.groupName ?? ""}|${flags.isLineage ?? false}`;
      this.pendingDocs.raceFolderSources.set(key, source);
    }
    const speciesDoc = ddbCharacter._ddbRace?.pendingSpeciesDocument;
    if (speciesDoc) {
      const flags = (foundry.utils.getProperty(speciesDoc, "flags.ddbimporter") ?? {}) as IDDBImporterFlags;
      const key = `${flags.baseRaceId ?? ""}|${flags.fullRaceName ?? speciesDoc.name}|${flags.groupName ?? ""}|${flags.isLineage ?? false}|${flags.is2014 ?? true}|${flags.isLegacy ?? false}`;
      this.pendingDocs.species.set(key, speciesDoc);
    }
  }

  async _flushCompendiumDocuments() {
    const total = this.pendingDocs.features.size + this.pendingDocs.traits.size
      + this.pendingDocs.feats.size + this.pendingDocs.backgrounds.size + this.pendingDocs.species.size;
    if (total === 0) return;
    this.notifier({ message: `Writing ${total} merged documents to compendiums` });
    await CharacterFeatureFactory.writePendingCompendiumDocuments({
      features: Array.from(this.pendingDocs.features.values()),
      traits: Array.from(this.pendingDocs.traits.values()),
      feats: Array.from(this.pendingDocs.feats.values()),
      backgrounds: Array.from(this.pendingDocs.backgrounds.values()),
      classMeta: Array.from(this.pendingDocs.classMeta.values()),
      raceFolderSources: Array.from(this.pendingDocs.raceFolderSources.values()),
    }, true);
    await DDBRace.writePendingSpeciesDocuments(
      Array.from(this.pendingDocs.species.values()),
      true,
    );
  }

  notifier({ progress, section, message }: NotifierV2Props) {
    // Notify the user about the import progress
    if (progress) {
      const builtMessage = `${progress.current}/${progress.total} : ${message}`;
      logger.info(builtMessage);
    } else {
      logger.info(`${message}`);
    }
    this.ddbMuncher?.notifierV2({ progress, section, message });
  }

  get URL() {
    switch (this.type) {
      case "class":
        return `/mule/class/${this.classId}`;
      case "feat":
        return `/mule/feat`;
      case "infusion":
        return `/mule/infusion`;
      case "background":
        return `/mule/background`;
      case "species":
        return `/mule/species`;
      default:
        throw new Error(`Unknown mule type ${this.type}`);
    }

  }

  async #fetchMuleData(url: string, body: IDDBMuleRequestBody, attempt = 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        body: JSON.stringify(body),
      });

      const jsonResponse = await response.json();
      if (jsonResponse.success) {
        this.source = jsonResponse.data;
        if (CONFIG.DDBI.DEV.downloadRAWJSONExamples) {
          FileHelper.download(JSON.stringify(jsonResponse.data), `RAW-${this.characterId}-${this.type}-${this.filterIds.join("_")}-${this.allowedSourceIds.join("_")}.json`, "application/json");
        }
      } else {
        if (attempt === this.attempts) {
          logger.error(`Final attempt failed on ${attempt}/${this.attempts}. No more retries.`, {
            url,
            jsonResponse,
          });
          throw new Error(`Mule fetch failed: ${jsonResponse.message}`);
        }
        const delay = 1000 * Math.pow(2, attempt - 1);
        logger.error(`Proxy Parse was not successful on attempt ${attempt}/${this.attempts}, retrying in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.#fetchMuleData(url, body, attempt + 1);
      }
    } catch (error) {
      if (attempt === this.attempts) {
        logger.error(`Final attempt failed on ${attempt}/${this.attempts}. No more retries.`, {
          url,
          error,
        });
        logger.error(error.stack);
        throw error;
      }
      const delay = 1000 * Math.pow(2, attempt - 1);
      logger.error(`Proxy fetch was not successful on attempt ${attempt}/${this.attempts}, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.#fetchMuleData(url, body, attempt + 1);
    }

  }

  async _fetchMuleData() {
    const parsingApi = DDBProxy.getProxy();
    const campaignId = DDBCampaigns.getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;
    const body: IDDBMuleRequestBody = {
      cobalt: Secrets.getCobalt(),
      betaKey: utils.getSetting<string>("beta-key"),
      characterId: this.characterId,
      campaignId: proxyCampaignId,
      filterModifiers: false,
      splitSpells: true,
      sources: this.allowedSourceIds,
      includeHomebrew: this.allowedHomebrew,
      onlyHomebrew: this.onlyHomebrew,
      filterIds: this.filterIds,
      cleanup: this.cleanup,
      backgroundId: this.backgroundId,
    };

    const url = `${parsingApi}${this.URL}`;
    await this.#fetchMuleData(url, body);
  }

  async _buildDDBStub(): Promise<IDDBData> {
    const stub = {
      backgroundEquipment: { slots: [] },
      character: foundry.utils.deepClone(this.source.baseCharacter) as IDDBCharacterData,
      classOptions: [],
      decorations: foundry.utils.deepClone(this.source.baseCharacter.decorations),
      infusions: {
        known: [],
        items: [],
        infusions: [],
      },
      name: foundry.utils.deepClone(this.source.baseCharacter.name),
      originOptions: [],
      startingEquipment: {
        slots: [],
      },
    };
    if (this.source.infusions) {
      stub.infusions = foundry.utils.deepClone(this.source.infusions);
    }
    return stub;
  }

  async _handleClassMunch() {
    // loop through each subclass and create a stub to import
    const classTotal = Object.keys(this.source.subClassData).length + 1;
    let classCurrent = 0;
    for (const subClassData of Object.values(this.source.subClassData)) {
      const ddbStub = await this._buildDDBStub();
      foundry.utils.mergeObject(ddbStub.character, subClassData.data);
      // if (subClassData.infusions) {
      //   ddbStub.infusions = foundry.utils.deepClone(subClassData.infusions);
      // }

      // for the subclass we now loop through each class choice
      classCurrent++;
      this.notifier({
        // progress: { current: classCurrent, total: classTotal },
        message: `Processing subclass ${subClassData.debug.subclassName} (${classCurrent} of ${classTotal})`,
      });

      const options = {
        temporary: true,
        displaySheet: false,
      };
      const mockCharacter = new (Actor.implementation as any)({
        name: subClassData.debug.subclassName,
        type: "character",
      }, options);

      const filteredSubClassChoices = this.source.subClassChoicesData.filter((c) => c.debug.subClassId === subClassData.debug.subClassId);

      const total = filteredSubClassChoices.length;
      let current = 0;
      for (const subClassChoiceData of filteredSubClassChoices) {
        current++;
        this.notifier({
          // progress: { current, total },
          message: `Processing subclass choice set for ${subClassData.debug.subclassName} (${current} of ${total})`,
        });
        const newStub = foundry.utils.deepClone(ddbStub);
        foundry.utils.mergeObject(newStub.character, subClassChoiceData.data);
        if (subClassChoiceData.infusions) {
          newStub.infusions = foundry.utils.deepClone(subClassChoiceData.infusions);
        }

        const ddbCharacter = new DDBCharacter({
          currentActor: mockCharacter,
          characterId: this.characterId,
          selectResources: false,
          enableSummons: true,
          addToCompendiums: true,
          collectCompendiumDocumentsOnly: true,
          compendiumImportTypes: ["classes", "features", "subclasses", "feats"],
          isMuncher: true,
        });
        ddbCharacter.source = { success: true, ddb: newStub };
        if (CONFIG.DDBI.DEV.downloadJSONExamples) {
          FileHelper.download(JSON.stringify(newStub), `${this.characterId}-${classCurrent}-${subClassData.debug.subclassName}-${current}.json`, "application/json");
        }
        await ddbCharacter.process();
        this.#mergePendingDocs(ddbCharacter);
        this.cachedClassCharacters.push(ddbCharacter);
        await this._loadCharacterIntoFoundryWorld(ddbCharacter);
      }
    }
  }

  async _finalizeClassCompendiumLinks() {
    if (this.cachedClassCharacters.length === 0) return;
    this.notifier({
      message: `Finalizing class/subclass compendium links for ${this.cachedClassCharacters.length} entries`,
    });
    let current = 0;
    for (const ddbCharacter of this.cachedClassCharacters) {
      current++;
      this.notifier({
        message: `Finalizing class/subclass ${current} of ${this.cachedClassCharacters.length}`,
      });
      try {
        await ddbCharacter._finalizeCompendiumLinks();
        this.#mergePendingClassDocs(ddbCharacter);
      } catch (error) {
        logger.error("Error finalizing class compendium links", { error, ddbCharacter });
        logger.error((error as Error).stack);
      }
    }
  }

  #mergePendingClassDocs(ddbCharacter: DDBCharacter) {
    const ddbClasses = ddbCharacter._classParser?.ddbClasses ?? {};
    for (const ddbClass of Object.values(ddbClasses)) {
      const pending = ddbClass.pendingClassDocument;
      if (!pending) continue;
      const flags = (foundry.utils.getProperty(pending.data, "flags.ddbimporter") ?? {}) as IDDBImporterFlags;
      const definitionId = flags.definitionId ?? pending.name;
      const is2014 = flags.is2014 ?? true;
      const key = `${pending.className}|${pending.name}|${definitionId}|${is2014}|${pending.versionStub}`;
      if (pending.isSubClass) {
        this.pendingDocs.subclasses.set(key, pending);
      } else {
        this.pendingDocs.classes.set(key, pending);
      }
    }
  }

  async _flushClassCompendiumDocuments() {
    const total = this.pendingDocs.classes.size + this.pendingDocs.subclasses.size;
    if (total === 0) return;
    this.notifier({ message: `Writing ${total} class/subclass documents to compendiums` });
    await DDBClass.writePendingClassDocuments({
      classes: Array.from(this.pendingDocs.classes.values()),
      subclasses: Array.from(this.pendingDocs.subclasses.values()),
    }, true);
  }


  async _handleFeatMunch() {
    const ddbStub = await this._buildDDBStub();

    this.notifier({
      message: `Processing feats`,
    });

    const options = {
      temporary: true,
      displaySheet: false,
    };
    const mockCharacter = new (Actor.implementation as any)({
      name: "Feat Muncher",
      type: "character",
    }, options);

    const total = this.source.featOptions.reduce((acc, curr) => acc + curr.data.feats.length, 0);
    let current = 1;
    let count = 0;
    logger.debug(`Processing ${total} feats`, { feats: this.source.featOptions, this: this });
    for (const featData of this.source.featOptions) {
      count += featData.data.feats.length;
      this.notifier({
        // progress: { current: `${current} - ${count}`, total },
        message: `Processing feats ${current} - ${count} of ${total}`,
      });
      const newStub = foundry.utils.deepClone(ddbStub);
      foundry.utils.mergeObject(newStub.character, featData.data);

      logger.debug(`Processing feats (${current} - ${count} of ${total})`, {
        newStub,
        featData,
        current,
        total,
        count,
      });
      if (CONFIG.DDBI.DEV.downloadJSONExamples) {
        FileHelper.download(JSON.stringify(newStub), `FEATS-${this.characterId}-${current}.json`, "application/json");
      }

      const ddbCharacter = new DDBCharacter({
        currentActor: mockCharacter,
        characterId: this.characterId,
        selectResources: false,
        enableSummons: true,
        addToCompendiums: true,
        collectCompendiumDocumentsOnly: true,
        compendiumImportTypes: ["feats"],
        isMuncher: true,
      });
      ddbCharacter.source = { success: true, ddb: newStub };
      await ddbCharacter.process();
      this.#mergePendingDocs(ddbCharacter);
      current = count + 1;
      await this._loadCharacterIntoFoundryWorld(ddbCharacter);
    }

  }


  async _handleBackgroundMunch() {
    const ddbStub = await this._buildDDBStub();

    this.notifier({
      message: `Processing backgrounds`,
    });

    const options = {
      temporary: true,
      displaySheet: false,
    };
    const mockCharacter = new (Actor.implementation as any)({
      name: "Background Muncher",
      type: "character",
    }, options);

    const total = this.source.backgroundOptions.length;
    let current = 1;

    logger.debug(`Processing ${total} backgrounds`, { backgrounds: this.source.backgroundOptions, this: this });
    for (const backgroundData of this.source.backgroundOptions) {
      this.notifier({
        // progress: { current, total },
        message: `Processing backgrounds ${current} of ${total}`,
      });
      const newStub = foundry.utils.deepClone(ddbStub);
      foundry.utils.mergeObject(newStub.character, backgroundData.backgroundResponse.data);
      foundry.utils.mergeObject(newStub.character, (backgroundData.backgroundChoices.slice(-1)?.data ?? null));

      logger.debug(`Processing background ${backgroundData.backgroundResponse.data.background.definition?.name} (${current} of ${total})`, {
        newStub,
        backgroundData,
        current,
        total,
      });


      const ddbCharacter = new DDBCharacter({
        currentActor: mockCharacter,
        characterId: this.characterId,
        selectResources: false,
        enableSummons: true,
        addToCompendiums: true,
        collectCompendiumDocumentsOnly: true,
        compendiumImportTypes: ["backgrounds", "feats"],
        isMuncher: true,
      });

      if (CONFIG.DDBI.DEV.downloadJSONExamples) {
        FileHelper.download(JSON.stringify(newStub), `BACKGROUND-${this.characterId}-${backgroundData.backgroundResponse.data.background.definition?.name}-${current}.json`, "application/json");
      }
      ddbCharacter.source = { success: true, ddb: newStub };
      await ddbCharacter.process();
      this.#mergePendingDocs(ddbCharacter);
      current++;
      await this._loadCharacterIntoFoundryWorld(ddbCharacter);
    }

  }

  async _handleSpeciesMunch() {
    const ddbStub = await this._buildDDBStub();

    this.notifier({
      message: `Processing species`,
    });

    const options = {
      temporary: true,
      displaySheet: false,
    };
    const mockCharacter = new (Actor.implementation as any)({
      name: "Species Muncher",
      type: "character",
    }, options);

    const total = this.source.speciesOptions.length;
    let current = 1;

    logger.debug(`Processing ${total} species choices`, { species: this.source.speciesOptions, this: this });
    for (const speciesData of this.source.speciesOptions) {
      this.notifier({
        // progress: { current, total },
        message: `Processing species choice set ${current} of ${total}`,
      });
      const newStub = foundry.utils.deepClone(ddbStub);
      newStub.character = speciesData.data;

      logger.debug(`Processing species ${speciesData.data.race.fullName ?? speciesData.data.race.baseName} (${current} of ${total})`, {
        newStub,
        speciesData,
        current,
        total,
      });
      if (CONFIG.DDBI.DEV.downloadJSONExamples) {
        FileHelper.download(JSON.stringify(newStub), `SPECIES-${this.characterId}-${speciesData.data.race.fullName ?? speciesData.data.race.baseName}-${current}.json`, "application/json");
      }

      const ddbCharacter = new DDBCharacter({
        currentActor: mockCharacter,
        characterId: this.characterId,
        selectResources: false,
        enableSummons: true,
        addToCompendiums: true,
        collectCompendiumDocumentsOnly: true,
        compendiumImportTypes: ["species", "traits", "feats"],
        isMuncher: true,
      });
      ddbCharacter.source = { success: true, ddb: newStub };
      await ddbCharacter.process();
      this.#mergePendingDocs(ddbCharacter);
      current++;
      await this._loadCharacterIntoFoundryWorld(ddbCharacter);
    }

  }

  async process() {
    await this._init();
    switch (this.type) {
      case "class":
        await this._handleClassMunch();
        break;
      case "feat":
        await this._handleFeatMunch();
        break;
      case "infusion":
        // await this._handleInfusionMunch();
        throw new Error("Infusion munching not yet supported");
      case "background":
        await this._handleBackgroundMunch();
        break;
      case "species":
        await this._handleSpeciesMunch();
        break;
      default:
        throw new Error(`Unknown munch type ${this.type}`);
    }
    await this._flushCompendiumDocuments();
    if (this.type === "class") {
      await this._finalizeClassCompendiumLinks();
      await this._flushClassCompendiumDocuments();
    }
  }


  static async munchFeats({ characterId, sources, homebrew, filterIds }: IDDBMuleHandlerQuickBase) {
    const muleHandler = new DDBMuleHandler({ characterId, sources, homebrew, type: "feat", filterIds });
    await muleHandler.process();

    logger.debug("Munch Complete", {
      characterId,
      muleHandler,
      filterIds,
      sources,
      homebrew,
    });
  }

  static async munchBackgrounds({ characterId, sources, homebrew, filterIds }: IDDBMuleHandlerQuickBase) {
    const muleHandler = new DDBMuleHandler({
      characterId,
      sources,
      homebrew,
      type: "background",
      filterIds,
      cleanup: false,
    });

    await muleHandler.process();

    logger.debug("Munch Complete", {
      characterId,
      muleHandler,
      filterIds,
      sources,
      homebrew,
    });
  }

  static async munchSpecies({ characterId, sources, homebrew, filterIds }: IDDBMuleHandlerQuickBase) {
    const muleHandler = new DDBMuleHandler({
      characterId,
      sources,
      homebrew,
      type: "species",
      filterIds,
      cleanup: false,
    });

    await muleHandler.process();

    logger.debug("Munch Complete", {
      characterId,
      muleHandler,
      filterIds,
      sources,
      homebrew,
    });
  }


  static async munchClass({ classId, characterId, sources, homebrew, filterIds, cleanup }: IDDBMuleHandlerQuickClass) {
    const muleHandler = new DDBMuleHandler({ classId, characterId, sources, homebrew, type: "class", filterIds, cleanup });
    await muleHandler.process();

    logger.debug("Munch Complete", {
      classId,
      characterId,
      muleHandler,
      filterIds,
      sources,
      homebrew,
    });
  }

  static async munchClasses({ characterId, classIds = [], sources, homebrew, filterIds, cleanup }: IDDBMuleHandlerQuickClassList) {
    const classList = await DDBMuleHandler.getList("class", sources);

    for (const klass of classList) {
      if (classIds.length > 0 && !classIds.includes(klass.id)) {
        logger.debug(`Skipping class ${klass.name} (${klass.id})`);
        continue;
      }
      logger.info(`Munching class ${klass.name} (${klass.id})`);
      await DDBMuleHandler.munchClass({ classId: klass.id, characterId, sources, homebrew, filterIds, cleanup });
    }

    logger.debug("Full Class Munch Complete", {
      characterId,
      sources,
      homebrew,
      classList,
      filterIds,
    });
  }

  // TODO:
  // Life domain parsing errors
  // Light domain parsing errors

  static async getList(type: string, sources: number[] | null = null) {
    const cacheHit = foundry.utils.getProperty(CONFIG.DDBI.KNOWN, `MULE_LISTS.${type}.${sources ? sources.join("_") : "all"}`);
    if (cacheHit) {
      return cacheHit;
    }
    const parsingApi = DDBProxy.getProxy();
    const campaignId = DDBCampaigns.getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;
    const body = {
      cobalt: Secrets.getCobalt(),
      campaignId: proxyCampaignId,
      betaKey: PatreonHelper.getPatreonKey(),
      sources: sources ?? [1, 2, 148, 145],
      includeEquipment: false,
    };

    let urlPostfix;
    switch (type) {
      case "class":
        urlPostfix = "/proxy/classes";
        break;
      case "feat":
        urlPostfix = "/proxy/feats";
        break;
      case "infusion":
        // urlPostfix = "/proxy/infusions";
        break;
      case "background":
        urlPostfix = "/proxy/backgrounds";
        break;
      case "species":
        // urlPostfix = "/proxy/species";
        break;
      default:
        throw new Error(`Unknown mule type ${type}`);
    }

    const response = await fetch(`${parsingApi}${urlPostfix}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!data.success) {
      logger.error(`Failure: ${data.message}`, { data });
      throw new Error(data.message);
    }

    await foundry.utils.setProperty(CONFIG.DDBI.KNOWN, `MULE_LISTS.${type}.${sources ? sources.join("_") : "all"}`, data.data);
    return data.data;
  }

  static async getSubclasses({ className, rulesVersion = "2024", includeHomebrew = false, campaignId = null }: IDDBGetSubClasses) {
    const cobaltCookie = Secrets.getCobalt();
    const resolvedCampaignId = campaignId ?? DDBCampaigns.getCampaignId();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const body = {
      cobalt: cobaltCookie,
      campaignId: resolvedCampaignId,
      betaKey,
      className,
      rulesVersion,
      includeHomebrew,
    };

    const response = await fetch(`${parsingApi}/proxy/subclass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.success) {
      logger.error(`Failure: ${data.message}`);
      throw new Error(data.message);
    }
    return data.data;

  }

  static async getSubclassesCached({ className, classId, rulesVersion = "2024", includeHomebrew = false, campaignId = null }: IDDBGetSubClasses & { classId: number | string }) {
    const cacheKey = `SUBCLASSES.${classId}.${rulesVersion}`;
    const cacheHit = foundry.utils.getProperty(CONFIG.DDBI.KNOWN, cacheKey);
    if (cacheHit) return cacheHit;
    const data = await DDBMuleHandler.getSubclasses({ className, rulesVersion, includeHomebrew, campaignId });
    await foundry.utils.setProperty(CONFIG.DDBI.KNOWN, cacheKey, data);
    return data;
  }

  static async getSlimCharacters(ids = []) {
    const cobaltCookie = Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const body = {
      cobalt: cobaltCookie,
      betaKey,
      characterIds: ids,
    };

    const response = await fetch(`${parsingApi}/proxy/character/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.success) {
      logger.error(`Failure: ${data.message}`);
      throw new Error(data.message);
    }
    return data.data;
  }

}
