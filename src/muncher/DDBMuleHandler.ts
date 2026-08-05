/**
 * DDBMuleHandler - bulk compendium munching via the "mule" proxy endpoint.
 *
 * The mule is a proxy-side process that drives a real (donor/"mule") D&D Beyond
 * character: the proxy repeatedly mutates that character (adding a class, a
 * subclass, each subclass choice combination, feats, a background, or a species)
 * and streams the resulting character JSON back to us over a socket
 * (DDBMuleSocket). Each streamed variant is then run through the normal
 * DDBCharacter parser against a temporary mock actor, and the parsed documents
 * are collected (not imported per-character) and finally written to compendiums
 * in one deduplicated pass.
 *
 * Entry points are the static munchClass/munchClasses/munchFeats/
 * munchBackgrounds/munchSpecies helpers, which construct a handler with a
 * `type` and call process().
 *
 * process() steps through:
 *
 * 1. _init() -> _fetchMuleData() -> #fetchMuleDataStreaming(): authenticates
 *    and starts a mule job on the proxy, then consumes events as they arrive.
 *    Every event is buffered into `this.source` (_ingestIterationItem) so the
 *    full payload is available later, and "actionable" events (subClassChoices,
 *    featOptions, backgroundOptions, speciesOptions) are queued for progressive
 *    processing via _scheduleStreamTask. Tasks run in arrival order at
 *    concurrency 1 (a Semaphore) so parsing keeps pace with the stream without
 *    interleaving. If the proxy has a cached result it sends a single cacheHit
 *    event instead; the buffered source is then replayed through the same
 *    per-item processors (_replayBufferedSourceThroughStreamProcessors).
 *
 * 2. Per-item processing (_processStream*): build a minimal DDB character stub
 *    from the streamed base character (_buildDDBStub), merge the variant's
 *    character data over it, then run a full DDBCharacter.process() with
 *    collectCompendiumDocumentsOnly against a mock (temporary) actor. The
 *    resulting pending documents are merged into the `pendingDocs` maps, keyed
 *    (#docKey) so the same feature arriving from multiple variants is only
 *    kept once.
 *
 * 3. After the stream drains, _flushCompendiumDocuments() writes the
 *    deduplicated features/traits/feats/backgrounds/species to compendiums.
 *
 * Classes and subclasses (type "class") get an extra sequence. The proxy
 * iterates every subclass of the requested classId; for each it sends
 * subClassData (the mule character with that subclass applied) followed by one
 * or more subClassChoices passes (each pass a different combination of choice
 * options, e.g. warlock invocations or fighting styles). Each choices payload
 * is merged over the matching subClassData and parsed as above; all variants
 * of one subclass share a single mock actor (_streamMockActors) so their
 * parsed DDBCharacters agree, and each parsed character is retained in
 * cachedClassCharacters. Class/subclass items cannot be written until their
 * features exist in the compendium, so after the generic flush in step 3,
 * _finalizeClassCompendiumLinks() revisits every cached character to resolve
 * feature links (advancement, spell lists) and collect the pending class and
 * subclass documents, and _flushClassCompendiumDocuments() writes those last.
 *
 * Progress reporting: the primary bar tracks stream events (subclass N of M,
 * feat chunk N of M); the secondary bar tracks completed import UNITS deduped
 * by id, so multi-pass subclasses count once.
 */
import DDBMuncher from "../apps/DDBMuncher";
import { DICTIONARY } from "../config/_module";
import { CompendiumHelper, DDBCampaigns, DDBProxy, DDBSources, FileHelper, FolderHelper, logger, PatreonHelper, postJson, Secrets, utils } from "../lib/_module";
import DDBMuleSocket, { DDBMuleEvent, DDBMuleStartParams } from "../lib/streaming/DDBMuleSocket";
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
  classId: number;
  cleanup?: boolean;
}

interface IDDBMuleHandlerQuickClassList extends IDDBMuleHandlerQuickBase {
  classIds: number[];
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
  systemRules: string;
  include2014Adjusted: boolean;
  includeOptionalClassFeatures: boolean;
  optionSources: number[];
}

export default class DDBMuleHandler {

  static LOADING_MESSAGES = DICTIONARY.messages.loading;
  characterId: string | null = null;
  classId: number | null = null;
  // buffered by _ingestIterationItem() during load, before processing reads it (guarded where load may not have run)
  source!: IDDBMuleClassSource;
  allowedSourceIds: number[] = [];
  allowedHomebrew = false;
  onlyHomebrew = false;
  includeOptionalClassFeatures = false;
  optionSourceIds: number[] = [];
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

  // Streaming progressive-import state. When true, all per-item work is
  // done and process() just runs the flush / finalize phases.
  _streamProcessedAll = false;
  // Per-subclass actor cache so each subclass's choice variants share
  // one mockCharacter (one actor per subclass id across event arrivals).
  _streamMockActors = new Map<string | number, any>();
  // Serialize per-item processing while the socket keeps emitting.
  _streamSemaphore: foundry.utils.Semaphore = new foundry.utils.Semaphore(1);
  // Outstanding task promises so _drainStreamProcessing can await them.
  _streamTaskPromises: Promise<void>[] = [];
  // Progress for the secondary (import) bar tracks UNITS, not events:
  // one subclass, one feat chunk, one background, one race. Multi-pass
  // subclasses count once so the bar is monotonic regardless of pass
  // count. Total is captured from the first event that carries it.
  _streamSecondaryUnits = new Set<string | number>();
  _streamSecondaryTotal = 0;

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
    optionalClassFeatures,
    optionSourceIds,
  }: IDDBMuleHandlerOptions) {
    if (!characterId) {
      throw new Error("characterId is required");
    }
    if (!type) {
      throw new Error("type is required");
    }
    this.characterId = characterId;
    this.classId = classId ?? null;
    this.allowedSourceIds = sources;
    this.allowedHomebrew = homebrew;
    this.onlyHomebrew = onlyHomebrew ?? this.allowedHomebrew;
    this.type = type;
    this.filterIds = filterIds;
    this.cleanup = cleanup;
    this.backgroundId = backgroundId;
    this.includeOptionalClassFeatures = optionalClassFeatures
      ?? utils.getSetting<boolean>("munching-policy-character-optional-class-features");
    this.optionSourceIds = optionSourceIds ?? Array.from(DDBSources.getChosenSourceIdSet());
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

  _getNewActorData({
    name = null,
    addFolder = true,
    addFlags = true,
  }: {
    name?: string | null;
    addFolder?: boolean;
    addFlags?: boolean;
  }): Partial<I5ePCData> {
    const characterData: Partial<I5ePCData> = {
      name: "New Actor",
      type: "character",
    };
    if (name) characterData.name = name;
    if (addFolder && this.folder) characterData.folder = this.folder;
    if (addFlags) {
      const flags = {
        ddbimporter: {
          dndbeyond: {
            characterId: this.characterId,
            url: `https://www.dndbeyond.com/characters/${this.characterId}`,
          },
        },
      };
      foundry.utils.setProperty(characterData, "flags", flags);
    }
    return characterData;
  }

  async _createNewActor({
    name = null,
    addFolder = true,
    addFlags = true,
  }: {
    name?: string | null;
    addFolder?: boolean;
    addFlags?: boolean;
  } = {}): Promise<Actor.Implementation> {
    const characterData = this._getNewActorData({ name, addFolder, addFlags });
    const actor: Actor.Implementation = await Actor.create(characterData as unknown as Actor.CreateInput) as Actor.Implementation;
    return actor;
  }

  _createMockActor(name: string): TImporterActor {
    const options = {
      temporary: true,
      displaySheet: false,
    };
    const mockData = this._getNewActorData({ name, addFolder: false, addFlags: false });
    // fvtt-types Actor.Implementation union does not structurally satisfy the
    // importer flag view, but it is the same runtime document
    const mockCharacter = new Actor.implementation(mockData as unknown as ConstructorParameters<typeof Actor.implementation>[0], options as unknown as ConstructorParameters<typeof Actor.implementation>[1]) as unknown as TImporterActor;
    return mockCharacter;
  }

  async _loadCharacterIntoFoundryWorld(ddbCharacter: DDBCharacter) {
    if (!CONFIG.DDBI.DEV.downloadFinalActorJSON) return;
    try {
      const actor: Actor.Implementation = await this._createNewActor();
      const actorData = actor.toObject() as unknown as I5ePCData;
      if (!actorData._id) {
        throw new Error("Newly created mule actor has no _id");
      }
      // fvtt-types Actor.Implementation union does not structurally satisfy the
      // importer flag view, but it is the same runtime document
      ddbCharacter.currentActor = actor as unknown as TImporterActor;
      const importer = new DDBCharacterImporter({
        actorId: actorData._id,
        ddbCharacter,
      });
      await importer.processCharacterData();
    } catch (error) {
      switch (utils.errorMessage(error)) {
        case "ImportFailure":
          logger.error("Failure");
          if (error instanceof Error) logger.error(error.stack);
          break;
        case "Forbidden":
          logger.error("Error retrieving Character: ", error);
          if (error instanceof Error) logger.error(error.stack);
          break;
        default:
          logger.error("Error processing Character: ", error);
          if (error instanceof Error) logger.error(error.stack);
          break;
      }
    }
  }

  _ensureSource() {
    if (!this.source) {
      (this as any).source = {};
    }
    const src = this.source as any;
    if (!src.subClasses) src.subClasses = {};
    if (!src.subClassData) src.subClassData = {};
    if (!src.subClassChoicesData) src.subClassChoicesData = [];
    if (!src.optionData) src.optionData = {};
    if (!src.optionChoicesData) src.optionChoicesData = [];
    if (!src.featOptions) src.featOptions = [];
    if (!src.backgroundOptions) src.backgroundOptions = [];
    if (!src.speciesOptions) src.speciesOptions = [];
  }

  _ingestBaseCharacter(payload: any) {
    this._ensureSource();
    (this.source as any).baseCharacter = payload;
  }

  _ingestIterationItem({ kind, payload }: { kind: string; payload: any }) {
    this._ensureSource();
    const src = this.source as any;
    switch (kind) {
      case "baseCharacter":
        src.baseCharacter = payload;
        break;
      case "class":
        src.class = payload;
        break;
      case "subClasses": {
        const id = this.classId ?? (Array.isArray(payload) && payload.length > 0 ? payload[0]?.classId : null);
        if (id != null) src.subClasses[id] = payload;
        else src.subClasses[String(Object.keys(src.subClasses).length)] = payload;
        break;
      }
      case "options":
        src.options = payload;
        break;
      case "subClassData": {
        const id = payload?.debug?.subClassId;
        if (id != null) src.subClassData[id] = payload;
        break;
      }
      case "subClassChoices":
        src.subClassChoicesData.push(payload);
        break;
      case "optionData": {
        const id = payload?.debug?.classFeatureId;
        if (id != null) src.optionData[id] = payload;
        break;
      }
      case "optionChoicesData":
        src.optionChoicesData.push(payload);
        break;
      case "featOptions":
        src.featOptions.push(payload);
        break;
      case "backgroundOptions":
        src.backgroundOptions.push(payload);
        break;
      case "speciesOptions":
        src.speciesOptions.push(payload);
        break;
      case "subClassStart":
        // progress marker only, no source mutation
        break;
      default:
        logger.warn(`Unknown mule iteration kind ${kind}`, { payload });
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
    this.notifier({
      message: `Writing ${total} merged documents to compendiums`,
      section: "level3",
    });
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

  notifier({ progress, section, message, progressBar }: NotifierV2Props) {
    // Notify the user about the import progress
    if (progress) {
      const builtMessage = `${progress.current}/${progress.total} : ${message}`;
      logger.info(builtMessage);
    } else {
      logger.info(`${message}`);
    }
    // Suppress the duplicate log in notifierV2 since we just logged above.
    this.ddbMuncher?.notifierV2({ progress, section, message, progressBar, suppress: true });
  }

  async _fetchMuleData() {
    const parsingApi = DDBProxy.getProxy();
    const campaignId = DDBCampaigns.getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;

    const isModern = utils.getSetting<string>("rulesVersion", "dnd5e") === "modern";
    const munchingRulesVersion = utils.getSetting<string>("munching-policy-character-class-rules-version");
    const is2024Import = munchingRulesVersion === "2024" || (munchingRulesVersion === "" && isModern);

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
      systemRules: isModern ? "2024" : "2014",
      include2014Adjusted: isModern && is2024Import,
      includeOptionalClassFeatures: this.includeOptionalClassFeatures,
      optionSources: this.optionSourceIds,
    };

    await this.#fetchMuleDataStreaming(parsingApi, body);
  }

  async #fetchMuleDataStreaming(parsingApi: string, body: IDDBMuleRequestBody) {
    const streamElement = this.type === "race" ? "species" : (this.type ?? "");
    const startParams: DDBMuleStartParams = {
      characterId: this.characterId,
      classId: this.classId,
      backgroundId: this.backgroundId,
      campaignId: body.campaignId,
      sources: this.allowedSourceIds,
      includeHomebrew: this.allowedHomebrew,
      onlyHomebrew: this.onlyHomebrew,
      cleanup: this.cleanup,
      filterIds: this.filterIds,
      systemRules: body.systemRules,
      include2014Adjusted: body.include2014Adjusted,
      useCache: true,
      cobalt: body.cobalt,
      includeOptionalClassFeatures: this.includeOptionalClassFeatures,
      optionSources: this.optionSourceIds,
    };

    this._ensureSource();
    const socket = new DDBMuleSocket(parsingApi);
    const startedAt = Date.now();
    let firstItemAt: number | null = null;
    let eventCount = 0;
    let cacheHit = false;
    const counts: Record<string, number> = {};
    try {
      const result = await new Promise<{ ok: boolean; message?: string }>((resolve, reject) => {
        let settled = false;
        socket.connect({
          onEvent: (event: DDBMuleEvent) => {
            if (event.kind === "cacheHit") {
              cacheHit = true;
              const cached = event.payload?.data ?? event.payload;
              if (cached) (this as any).source = cached;
              return;
            }
            if (["started", "done", "error"].includes(event.kind)) return;
            eventCount++;
            counts[event.kind] = (counts[event.kind] ?? 0) + 1;
            if (firstItemAt === null) firstItemAt = Date.now();
            this._ingestIterationItem({ kind: event.kind, payload: event.payload });
            this._notifyStreamProgress(event);
            this._scheduleStreamProcessing(event);
          },
          onError: (message, fatal) => {
            if (settled) return;
            if (fatal) {
              settled = true;
              reject(new Error(message));
            } else {
              logger.warn(`[DDBMuleSocket] non-fatal error: ${message}`);
            }
          },
          onDone: (summary) => {
            if (settled) return;
            settled = true;
            resolve({ ok: true, message: summary?.message });
          },
          onConnectError: (err) => {
            if (settled) return;
            settled = true;
            reject(err);
          },
        });

        (async () => {
          try {
            const authBody = {
              betaKey: body.betaKey,
              cobalt: body.cobalt,
              characterId: this.characterId,
              campaignId: body.campaignId,
            };
            const authRes = await socket.auth(authBody);
            if (!authRes.ok) throw new Error(`Auth failed: ${authRes.message}`);
            const startRes = await socket.start(streamElement, startParams);
            if (!startRes.ok) throw new Error(`Start failed: ${startRes.message}`);
            logger.debug(`[DDBMuleSocket] jobId=${startRes.jobId} replayed=${startRes.replayed}`);
            // this.notifier({ message: `Streaming ${streamElement} (jobId=${startRes.jobId?.slice(0, 8)})` });
          } catch (err) {
            if (!settled) {
              settled = true;
              reject(err as Error);
            }
          }
        })();
      });

      if (cacheHit) {
        await this._replayBufferedSourceThroughStreamProcessors();
      } else {
        await this._drainStreamProcessing();
        this._streamProcessedAll = true;
      }
      if (CONFIG.DDBI.DEV.downloadRAWJSONExamples) {
        FileHelper.download(JSON.stringify(this.source), `RAW-${this.characterId}-${this.type}-${this.filterIds.join("_")}-${this.allowedSourceIds.join("_")}.json`, "application/json");
      }
      const totalMs = Date.now() - startedAt;
      const ttfiMs = firstItemAt != null ? firstItemAt - startedAt : null;
      logger.debug(`[DDBMuleSocket] stream complete: total=${totalMs}ms ttfi=${ttfiMs}ms events=${eventCount} kinds=${JSON.stringify(counts)} progressive=${this._streamProcessedAll}`, { result });
      // this.notifier({ message: `Stream complete in ${(totalMs / 1000).toFixed(1)}s (${eventCount} events)` });
    } finally {
      socket.close();
    }
  }

  _scheduleStreamProcessing(event: DDBMuleEvent) {
    switch (event.kind) {
      case "subClassChoices": {
        const payload = event.payload;
        const subClassList = (this.source?.subClasses?.[this.classId ?? ""] ?? []);
        if (subClassList.length > 0) this._streamSecondaryTotal = subClassList.length;
        const subClassId = payload?.debug?.subClassId ?? null;
        const desc = `${payload?.debug?.subclassName ?? "subclass"} pass ${event.pass ?? "?"}`;
        this._scheduleStreamTask("subClassChoices", desc, subClassId, () => this._processStreamSubClassChoice(payload));
        break;
      }
      case "featOptions": {
        const payload = event.payload;
        if (event.total) this._streamSecondaryTotal = event.total;
        const unitId = `feat:${event.index ?? this._streamSecondaryUnits.size + 1}`;
        const desc = `feat chunk ${event.index ?? "?"}${event.repeatable ? " (repeatable)" : ""}`;
        this._scheduleStreamTask("featOptions", desc, unitId, () => this._processStreamFeatOption(payload));
        break;
      }
      case "backgroundOptions": {
        const payload = event.payload;
        if (event.total) this._streamSecondaryTotal = event.total;
        const name = payload?.backgroundResponse?.data?.background?.definition?.name ?? "background";
        const id = payload?.backgroundResponse?.data?.background?.definition?.id ?? name;
        this._scheduleStreamTask("backgroundOptions", name, id, () => this._processStreamBackground(payload));
        break;
      }
      case "speciesOptions": {
        const payload = event.payload;
        if (event.raceTotal) this._streamSecondaryTotal = event.raceTotal;
        const name = payload?.data?.race?.fullName ?? payload?.data?.race?.baseName ?? "species";
        const id = payload?.data?.race?.entityRaceId ?? name;
        const desc = `${name} pass ${event.pass ?? "?"}`;
        this._scheduleStreamTask("speciesOptions", desc, id, () => this._processStreamSpecies(payload));
        break;
      }
      default:
        break;
    }
  }

  _notifyStreamProgress(event: DDBMuleEvent) {
    switch (event.kind) {
      case "subClassStart": {
        const total = event.total ?? 0;
        const index = event.index ?? 0;
        this.notifier({
          progress: { current: index, total },
          section: "level1",
          message: `Subclass ${event.payload?.name ?? "?"}`,
        });
        break;
      }
      case "subClassChoices": {
        const pass = event.pass ?? 0;
        this.notifier({
          section: "level3",
          message: ` Subclass choices pass ${pass} captured ...`,
        });
        break;
      }
      case "optionData": {
        // these are discarded when optional class features are not being imported
        if (!this.includeOptionalClassFeatures) break;
        this.notifier({
          section: "level3",
          message: ` Fetching optional feature ${event.payload?.debug?.optionName ?? "?"}`,
        });
        break;
      }
      case "featOptions": {
        const total = event.total ?? 0;
        const index = event.index ?? 0;
        this.notifier({
          progress: total > 0 ? { current: index, total } : undefined,
          section: "level1",
          message: `Feat chunk${event.repeatable ? " (repeatable)" : ""} ${index}/${total || "?"}`,
        });
        break;
      }
      case "backgroundOptions": {
        const total = event.total ?? 0;
        const index = event.index ?? 0;
        this.notifier({
          progress: total > 0 ? { current: index, total } : undefined,
          section: "level1",
          message: `Background ${index}/${total || "?"}`,
        });
        break;
      }
      case "speciesOptions": {
        const total = event.raceTotal ?? 0;
        const index = event.raceIndex ?? 0;
        this.notifier({
          progress: total > 0 ? { current: index, total } : undefined,
          section: "level1",
          message: `Species ${index}/${total || "?"} pass ${event.pass ?? 1}`,
        });
        break;
      }
      default:
        break;
    }
  }

  /**
   * Optional class features arrive from the mule unfiltered: the mule character can
   * see every option DDB offers it. Gate them behind the muncher setting, and when
   * enabled restrict them to the chosen sources (homebrew options follow the
   * homebrew toggle).
   */
  _filterClassOptions(options: IDDBClassFeatureDefinition[]): IDDBClassFeatureDefinition[] {
    if (!this.includeOptionalClassFeatures) {
      if (options.length > 0) {
        logger.debug(`Skipping ${options.length} optional class features, import disabled`);
      }
      return [];
    }
    const allowedSourceIds = new Set(this.optionSourceIds);
    const kept = options.filter((option) => option.isHomebrew
      ? this.allowedHomebrew
      : DDBSources.isDefinitionInSourceIds(option, allowedSourceIds));

    if (kept.length !== options.length) {
      const dropped = options.filter((option) => !kept.includes(option));
      logger.debug(`Filtered out ${dropped.length} optional class features not in the selected sources`, {
        dropped: dropped.map((option) => ({
          name: option.name,
          isHomebrew: option.isHomebrew,
          sourceIds: (option.sources ?? []).map((source) => source.sourceId),
        })),
        allowedSourceIds: this.optionSourceIds,
        allowedHomebrew: this.allowedHomebrew,
      });
    }

    return kept;
  }

  async _buildDDBStub(): Promise<IDDBData> {
    const allClassOptions: IDDBClassFeatureDefinition[] = (this.source as Partial<IDDBMuleClassSource>).options
      ? foundry.utils.deepClone((this.source as IDDBMuleClassSource).options) as IDDBClassFeatureDefinition[]
      : [];
    const classOptions = this._filterClassOptions(allClassOptions);

    const stub: IDDBData = {
      backgroundEquipment: { slots: [] },
      character: foundry.utils.deepClone(this.source.baseCharacter) as IDDBCharacterData,
      classOptions,
      decorations: foundry.utils.deepClone(this.source.baseCharacter.decorations),
      infusions: {
        known: [],
        item: [],
        infusions: {
          definitionData: [],
          accessTypes: {},
        },
      },
      name: foundry.utils.deepClone(this.source.baseCharacter.name),
      originOptions: [],
      startingEquipment: {
        slots: [],
      },
      unfilteredModifiers: {
        class: [],
        race: [],
        background: [],
        item: [],
        feat: [],
        condition: [],
      },
    };
    if (this.source.infusions) {
      stub.infusions = foundry.utils.deepClone(this.source.infusions);
    }
    return stub;
  }

  async _finalizeClassCompendiumLinks() {
    if (this.cachedClassCharacters.length === 0) return;
    this.notifier({
      section: "level3",
      message: `Finalizing class/subclass compendium links for ${this.cachedClassCharacters.length} entries`,
    });
    let current = 0;
    for (const ddbCharacter of this.cachedClassCharacters) {
      current++;
      this.notifier({
        section: "level3",
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


  // Queue an async task on the stream semaphore. Tasks run in arrival
  // order at concurrency 1. Errors are caught and logged per-task so one
  // bad event does not break the queue. After each task settles the
  // secondary progress bar advances by one UNIT (deduped via unitId), not
  // per pass, so multi-pass subclasses do not inflate the count.
  _scheduleStreamTask(label: string, description: string, unitId: string | number | null, task: () => Promise<void>) {
    const wrapped = async () => {
      try {
        await task();
      } catch (err) {
        logger.error(`[stream-process] ${label} failed: ${(err as Error).message}`, err);
      } finally {
        if (unitId != null) this._streamSecondaryUnits.add(unitId);
        const current = this._streamSecondaryUnits.size;
        const total = this._streamSecondaryTotal > 0 ? this._streamSecondaryTotal : Math.max(current, 1);
        this.notifier({
          section: "level4",
          message: `Imported ${description}`,
          progress: { current, total },
          progressBar: "secondary",
        });
      }
    };
    this._streamTaskPromises.push(this._streamSemaphore.add(wrapped));
  }

  _resetSecondaryProgress() {
    this._streamSecondaryUnits.clear();
    this._streamSecondaryTotal = 0;
    this.notifier({
      section: "level4",
      message: "",
      progress: { current: 0, total: 1 },
      progressBar: "secondary",
    });
  }

  async _drainStreamProcessing() {
    await Promise.all(this._streamTaskPromises);
    this._streamTaskPromises = [];
  }

  _getStreamMockActor(key: string | number, name: string) {
    let actor: TImporterActor = this._streamMockActors.get(key);
    if (!actor) {
      actor = this._createMockActor(name);
      this._streamMockActors.set(key, actor);
    }
    return actor;
  }

  async _subclassChoiceProcess({
    name,
    ddbStub,
    mockCharacter,
    subClassChoiceData,
  }: {
    name: string;
    ddbStub: IDDBData;
    mockCharacter: TImporterActor;
    subClassChoiceData: IDDBMuleSubClassChoicesDataEntry;
  }) {
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
      FileHelper.download(JSON.stringify(newStub), `STREAM-${this.characterId}-${name}-${this.cachedClassCharacters.length}.json`, "application/json");
    }
    await ddbCharacter.process();
    this.#mergePendingDocs(ddbCharacter);
    this.cachedClassCharacters.push(ddbCharacter);
    await this._loadCharacterIntoFoundryWorld(ddbCharacter);
  }

  async _processStreamSubClassChoice(subClassChoiceData: any) {
    const subClassId = subClassChoiceData?.debug?.subClassId;
    if (subClassId == null) {
      logger.warn(`[stream-process] subClassChoices missing debug.subClassId`, { subClassChoiceData });
      return;
    }
    const subClassData = (this.source as any).subClassData?.[subClassId];
    if (!subClassData) {
      logger.warn(`[stream-process] no subClassData for subClassId ${subClassId} yet, deferring`);
      return;
    }
    const mockCharacter = this._getStreamMockActor(`class:${subClassId}`, subClassData.debug.subclassName);
    const ddbStub = await this._buildDDBStub();
    foundry.utils.mergeObject(ddbStub.character, subClassData.data);
    await this._subclassChoiceProcess({
      name: subClassData.debug.subclassName,
      ddbStub,
      mockCharacter,
      subClassChoiceData,
    });
  }

  async _featOptionsProcess({
    mockCharacter,
    ddbStub,
    featData,
  }: {
    mockCharacter: TImporterActor;
    ddbStub: IDDBData;
    featData: any;
  }) {
    // logger.debug(`[stream-process] processing feat chunk ${featData?.debug?.chunkIndex ?? "?"} of ${this._streamSecondaryTotal}`, { featData });
    const newStub = foundry.utils.deepClone(ddbStub);
    foundry.utils.mergeObject(newStub.character, featData.data);
    if (CONFIG.DDBI.DEV.downloadJSONExamples) {
      FileHelper.download(JSON.stringify(newStub), `STREAM-FEATS-${this.characterId}-${Date.now()}.json`, "application/json");
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
    await this._loadCharacterIntoFoundryWorld(ddbCharacter);
  }

  async _processStreamFeatOption(featData: any) {
    const mockCharacter = this._getStreamMockActor("feat", "Feat Muncher");
    const ddbStub = await this._buildDDBStub();
    await this._featOptionsProcess({
      mockCharacter,
      ddbStub,
      featData,
    });
  }

  async _backgroundProcess({
    mockCharacter,
    ddbStub,
    backgroundData,
  }: {
    mockCharacter: TImporterActor;
    ddbStub: IDDBData;
    backgroundData: any;
  }) {
    const newStub = foundry.utils.deepClone(ddbStub);
    foundry.utils.mergeObject(newStub.character, backgroundData.backgroundResponse.data);
    const choiceData = backgroundData.backgroundChoices.slice(-1)?.data ?? null;
    if (choiceData) foundry.utils.mergeObject(newStub.character, choiceData);
    if (backgroundData.backgroundEquipment) {
      newStub.backgroundEquipment = foundry.utils.deepClone(backgroundData.backgroundEquipment);
    }
    if (CONFIG.DDBI.DEV.downloadJSONExamples) {
      const name = backgroundData.backgroundResponse.data.background.definition?.name ?? "unknown";
      FileHelper.download(JSON.stringify(newStub), `STREAM-BACKGROUND-${this.characterId}-${name}-${Date.now()}.json`, "application/json");
    }
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
    ddbCharacter.source = { success: true, ddb: newStub };
    await ddbCharacter.process();
    this.#mergePendingDocs(ddbCharacter);
    await this._loadCharacterIntoFoundryWorld(ddbCharacter);
  }

  async _processStreamBackground(backgroundData: any) {
    const mockCharacter = this._getStreamMockActor("background", "Background Muncher");
    const ddbStub = await this._buildDDBStub();
    await this._backgroundProcess({
      mockCharacter,
      ddbStub,
      backgroundData,
    });
  }

  async _speciesProcess({
    mockCharacter,
    ddbStub,
    speciesData,
  }: {
    mockCharacter: TImporterActor;
    ddbStub: IDDBData;
    speciesData: any;
  }) {
    const newStub = foundry.utils.deepClone(ddbStub);
    newStub.character = speciesData.data;
    if (CONFIG.DDBI.DEV.downloadJSONExamples) {
      const name = speciesData.data.race.fullName ?? speciesData.data.race.baseName ?? "unknown";
      FileHelper.download(JSON.stringify(newStub), `STREAM-SPECIES-${this.characterId}-${name}-${Date.now()}.json`, "application/json");
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
    await this._loadCharacterIntoFoundryWorld(ddbCharacter);
  }

  async _processStreamSpecies(speciesData: any) {
    const mockCharacter = this._getStreamMockActor("species", "Species Muncher");
    const ddbStub = await this._buildDDBStub();
    await this._speciesProcess({
      mockCharacter,
      ddbStub,
      speciesData,
    });
  }

  async _replayBufferedSourceThroughStreamProcessors() {
    this._ensureSource();
    const src = this.source as any;
    switch (this.type) {
      case "class": {
        const subClassList = (src.subClasses?.[this.classId ?? ""] ?? []) as any[];
        if (subClassList.length > 0) this._streamSecondaryTotal = subClassList.length;
        for (const choice of (src.subClassChoicesData ?? []) as any[]) {
          const desc = `${choice?.debug?.subclassName ?? "subclass"} (cached)`;
          const id = choice?.debug?.subClassId ?? null;
          this._scheduleStreamTask("subClassChoices (cacheHit)", desc, id, () => this._processStreamSubClassChoice(choice));
        }
        break;
      }
      case "feat": {
        const feats = (src.featOptions ?? []) as any[];
        this._streamSecondaryTotal = feats.length;
        for (const [i, featData] of feats.entries()) {
          this._scheduleStreamTask("featOptions (cacheHit)", `feat chunk ${i + 1} (cached)`, `feat:${i + 1}`, () => this._processStreamFeatOption(featData));
        }
        break;
      }
      case "background": {
        const backgrounds = (src.backgroundOptions ?? []) as any[];
        this._streamSecondaryTotal = backgrounds.length;
        for (const bg of backgrounds) {
          const name = bg?.backgroundResponse?.data?.background?.definition?.name ?? "background";
          const id = bg?.backgroundResponse?.data?.background?.definition?.id ?? name;
          this._scheduleStreamTask("backgroundOptions (cacheHit)", `${name} (cached)`, id, () => this._processStreamBackground(bg));
        }
        break;
      }
      case "species": {
        const species = (src.speciesOptions ?? []) as any[];
        // Unique race ids in cached data so total represents unique races, not passes
        const raceIds = new Set<string | number>();
        for (const sp of species) {
          const id = sp?.data?.race?.entityRaceId ?? sp?.data?.race?.fullName ?? sp?.data?.race?.baseName;
          if (id != null) raceIds.add(id);
        }
        this._streamSecondaryTotal = raceIds.size > 0 ? raceIds.size : species.length;
        for (const sp of species) {
          const name = sp?.data?.race?.fullName ?? sp?.data?.race?.baseName ?? "species";
          const id = sp?.data?.race?.entityRaceId ?? name;
          this._scheduleStreamTask("speciesOptions (cacheHit)", `${name} (cached)`, id, () => this._processStreamSpecies(sp));
        }
        break;
      }
      default:
        throw new Error(`Unknown munch type ${this.type}`);
    }
    await this._drainStreamProcessing();
    this._streamProcessedAll = true;
  }

  async process() {
    this._resetSecondaryProgress();
    await this._init();
    if (!this._streamProcessedAll) {
      throw new Error(`DDBMule: _init completed but _streamProcessedAll is false. type=${this.type}`);
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
    const classList = await DDBMuleHandler.getList<IDDBMuleClassDefinition>("class", sources);

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

  static async getList<T extends TDDBMuleGetList>(type: string, sources: number[] | null = null): Promise<T[]> {
    const cacheHit = foundry.utils.getProperty(CONFIG.DDBI.KNOWN, `MULE_LISTS.${type}.${sources ? sources.join("_") : "all"}`);
    if (cacheHit) {
      return cacheHit as T[];
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
        urlPostfix = "/proxy/races";
        break;
      default:
        throw new Error(`Unknown mule type ${type}`);
    }

    const data = await postJson(`${parsingApi}${urlPostfix}`, body);

    if (!data.success) {
      logger.error(`Failure: ${data.message}`, { data });
      throw new Error(data.message);
    }

    await foundry.utils.setProperty(CONFIG.DDBI.KNOWN, `MULE_LISTS.${type}.${sources ? sources.join("_") : "all"}`, data.data);
    return data.data as T[];
  }

  /**
   * Build a set of DDB ids already present in a compendium, used by the
   * "Don't grab existing things" muncher option. Filters to the current rules
   * version via the `is2014` flag so 2014/2024 duplicates are not conflated.
   * Falls back to an empty set (grab everything) on any lookup failure.
   */
  static async #getExistingCompendiumIds(
    compendiumType: string,
    idFlag: string,
    rulesVersion: T5eRulesVersion | null,
    { docType = null }: { docType?: string | null } = {},
  ): Promise<Set<number>> {
    const result = new Set<number>();
    try {
      const fields = ["name", `flags.ddbimporter.${idFlag}`, "flags.ddbimporter.is2014"];
      if (docType) fields.push("type");
      const index = await CompendiumHelper.loadCompendiumIndex(compendiumType as any, { fields });
      if (!index) return result;
      // null rulesVersion => match any version (used by the version-agnostic species munch)
      const want2014 = rulesVersion === null ? null : rulesVersion === "2014";
      for (const entry of index.contents) {
        if (docType && foundry.utils.getProperty(entry, "type") !== docType) continue;
        const is2014 = foundry.utils.getProperty(entry, "flags.ddbimporter.is2014");
        if (want2014 !== null && typeof is2014 === "boolean" && is2014 !== want2014) continue;
        const id = foundry.utils.getProperty(entry, `flags.ddbimporter.${idFlag}`);
        if (typeof id === "number") result.add(id);
      }
    } catch (error) {
      logger.warn(`Failed to load existing ${compendiumType} ids for dedupe`, error);
    }
    return result;
  }

  static async getExistingSpeciesIds(rulesVersion: T5eRulesVersion | null): Promise<Set<number>> {
    return DDBMuleHandler.#getExistingCompendiumIds("species", "entityRaceId", rulesVersion);
  }

  static async getExistingSubclassIds(rulesVersion: T5eRulesVersion | null): Promise<Set<number>> {
    return DDBMuleHandler.#getExistingCompendiumIds("class", "definitionId", rulesVersion, { docType: "subclass" });
  }

  // note the plural compendium keys: "feat" resolves to the class compendium
  static async getExistingFeatIds(rulesVersion: T5eRulesVersion | null): Promise<Set<number>> {
    return DDBMuleHandler.#getExistingCompendiumIds("feats", "id", rulesVersion);
  }

  static async getExistingBackgroundIds(rulesVersion: T5eRulesVersion | null): Promise<Set<number>> {
    return DDBMuleHandler.#getExistingCompendiumIds("backgrounds", "id", rulesVersion);
  }

  static async getSubclasses({ className, rulesVersion = "2024", includeHomebrew = false, campaignId = null }: IDDBGetSubClasses): Promise<IDDBMuleSubclassDefinition[]> {
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

    const data: IDDBMuleSubclassesResponse = await postJson(`${parsingApi}/proxy/subclass`, body);
    if (!data.success) {
      logger.error(`Failure: ${data.message}`);
      throw new Error(data.message);
    }
    return data.data;

  }

  static async getSubclassesCached({
    className,
    classId,
    rulesVersion = "2024",
    includeHomebrew = false,
    campaignId = null,
  }: IDDBGetSubClasses & { classId: number | string }): Promise<IDDBMuleSubclassDefinition[]> {
    const cacheKey = `SUBCLASSES.${classId}.${rulesVersion}`;
    const cacheHit = foundry.utils.getProperty(CONFIG.DDBI.KNOWN, cacheKey) as IDDBMuleSubclassDefinition[] | undefined;
    if (cacheHit) return cacheHit;
    const data = await DDBMuleHandler.getSubclasses({ className, rulesVersion, includeHomebrew, campaignId });
    await foundry.utils.setProperty(CONFIG.DDBI.KNOWN, cacheKey, data);
    return data;
  }

  static async getSlimCharacters(ids: string[] = []) {
    const cobaltCookie = Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const body = {
      cobalt: cobaltCookie,
      betaKey,
      characterIds: ids,
    };

    const data = await postJson(`${parsingApi}/proxy/character/check`, body);
    if (!data.success) {
      logger.error(`Failure: ${data.message}`);
      throw new Error(data.message);
    }
    return data.data;
  }

}
