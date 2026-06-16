import {
  logger,
  utils,
  FileHelper,
  FolderHelper,
  detectGrid,
  buildCandidateSummary,
  getMapScaleMultiplier,
  isGridDetectionEnabled,
  resolveGrid,
  sampleEdgeBackgroundColor,
} from "../../lib/_module";
import DDBQuickplay from "./DDBQuickplay";
import DDBQuickplayTokens from "./DDBQuickplayTokens";
import DDBMapMetaData from "./DDBMapMetaData";
import DDBMaps from "../DDBMaps";

const DEFAULT_UPLOAD_PATH = "[data] ddb-images/maps";
const DEFAULT_LEVEL_ID = "defaultLevel0000";


export default class DDBMap {

  map: IDDBMap;
  options: IDDBMapImportOptions;
  uploadedPath: string | null = null;
  scene: any | null = null;
  detection: IGridDetectionResult | null = null;
  backgroundColor: string | null = null;
  // Cached prepared (Quickplay) state. Fetched lazily once per import so both
  // sticker and token placement can share the same payload.
  private _preparedState: IDDBPreparedState | null | undefined = undefined;

  // Serial chain for FileHelper.uploadImage calls. Foundry's FilePicker upload
  // handles concurrent calls poorly, so even when multiple imports run in
  // parallel for download + grid detection, all uploads queue through here.
  private static _uploadChain: Promise<unknown> = Promise.resolve();

  private static _runOnUploadChain<T>(fn: () => Promise<T>): Promise<T> {
    const next = DDBMap._uploadChain.then(fn, fn);
    DDBMap._uploadChain = next.then(() => undefined, () => undefined);
    return next as Promise<T>;
  }

  constructor(map: IDDBMap, options: IDDBMapImportOptions = {}) {
    this.map = map;
    this.options = options;
  }

  private _notify(msg: string) {
    if (this.options.notifier) this.options.notifier(msg);
  }

  private _uploadDirectory(): string {
    const fromOptions = this.options.uploadPath?.trim();
    if (fromOptions) return fromOptions;
    try {
      const fromSetting = utils.getSetting<string>("maps-upload-path");
      if (fromSetting && fromSetting.trim() !== "") return fromSetting;
    } catch (_e) { /* ignore unregistered */ }
    return DEFAULT_UPLOAD_PATH;
  }

  private _filename(): string {
    const last = (this.map.imageKey || "").split("/").pop() || this.map.id || "map";
    return last.replace(/[^A-Za-z0-9._-]+/g, "-");
  }

  private _sceneName(): string {
    const desc = (this.map.description ?? "").trim();
    if (!desc) return this.map.name;
    return `${this.map.name} ${desc}`.trim();
  }

  async upload(): Promise<string | null> {
    if (this.uploadedPath) return this.uploadedPath;
    if (!this.map.imageKey) {
      throw new Error(`Map "${this.map.name}" has no imageKey`);
    }

    this._notify(`Downloading ${this.map.name}...`);
    const blob = await DDBMaps.downloadImage({
      key: this.map.imageKey,
      cobalt: this.options.cobalt ?? null,
      campaignId: this.options.campaignId ?? null,
    });
    if (!blob) throw new Error(`Could not download image for "${this.map.name}"`);

    // Grid detection and edge-colour sampling both work off the raw blob and
    // are independent, so run them in parallel. Either failing degrades
    // gracefully (null result) without blocking the import.
    const detectGridTask = (async () => {
      if (!isGridDetectionEnabled()) return null;
      try {
        this._notify(`Detecting grid for ${this.map.name}...`);
        const multiplier = getMapScaleMultiplier();
        const tokenScaleHint = this.map.tokenScale;
        const expectedScale = (typeof tokenScaleHint === "number" && tokenScaleHint > 0)
          ? tokenScaleHint * multiplier
          : tokenScaleHint;
        const result = await detectGrid(blob, { expectedScale });
        logger.debug(`Grid detection for ${this.map.name}:`, result);
        return result;
      } catch (error) {
        logger.warn(`Grid detection failed for ${this.map.name}: ${(error as Error).message}`);
        return null;
      }
    })();

    const edgeColorTask = (async () => {
      try {
        return await sampleEdgeBackgroundColor(blob, { edgeWidth: 20 });
      } catch (error) {
        logger.warn(`Edge colour sampling failed for ${this.map.name}: ${(error as Error).message}`);
        return null;
      }
    })();

    const [detection, edgeColor] = await Promise.all([detectGridTask, edgeColorTask]);
    this.detection = detection;
    this.backgroundColor = edgeColor;

    const directory = this._uploadDirectory();
    const filename = this._filename();
    this._notify(`Uploading ${filename}...`);
    this.uploadedPath = await DDBMap._runOnUploadChain(() =>
      FileHelper.uploadImage(blob, directory, filename),
    );
    return this.uploadedPath;
  }

  private _resolveGrid(width: number): IResolvedGrid {
    return resolveGrid({
      detection: this.detection,
      tokenScale: this.map.tokenScale,
      width,
      multiplier: getMapScaleMultiplier(),
    });
  }

  private _buildCandidateSummary(width: number): ICandidateSummary {
    return buildCandidateSummary({
      detection: this.detection,
      tokenScale: this.map.tokenScale,
      width,
      multiplier: getMapScaleMultiplier(),
    });
  }

  // Walk the configured folderPath and create (or reuse) a chain of Scene
  // folders. Returns the leaf folder id, or null when no path was provided.
  private async _resolveFolderId(): Promise<string | null> {
    const path = this.options.folderPath;
    if (!path?.length) return null;
    const sorts = this.options.folderSorts ?? [];
    let parent: any = null;
    for (let i = 0; i < path.length; i++) {
      const rawName = path[i];
      const name = (rawName ?? "").trim();
      if (!name) continue;
      const sort = typeof sorts[i] === "number" && Number.isFinite(sorts[i]) ? sorts[i] : null;
      parent = await FolderHelper.getOrCreateFolder(parent, "Scene", name, "", { sort });
    }
    return parent?.id ?? null;
  }

  async createScene(): Promise<Scene | null> {
    if (this.scene) return this.scene;
    if (!this.uploadedPath) await this.upload();
    if (!this.uploadedPath) throw new Error(`No uploaded image path for "${this.map.name}"`);

    const dimensions = this.map.imageDimensions ?? { x: 4000, y: 3000 };
    const grid = this._resolveGrid(dimensions.x);
    const gridSize = Math.max(1, Math.round(grid.size));
    const sceneWidth = Math.max(1, Math.round(dimensions.x * grid.sceneScale));
    const sceneHeight = Math.max(1, Math.round(dimensions.y * grid.sceneScale));
    const candidates = this._buildCandidateSummary(dimensions.x);
    logger.info(`Grid candidates for "${this.map.name}":`, {
      chosen: { source: grid.source, size: gridSize, offsetX: Math.round(grid.offsetX), offsetY: Math.round(grid.offsetY), sceneWidth, sceneHeight },
      ...candidates,
    });
    const folderId = await this._resolveFolderId();
    const data: I5eSceneData = {
      name: this._sceneName(),
      levels: [
        {
          _id: DEFAULT_LEVEL_ID,
          name: "Level",
          background: {
            src: this.uploadedPath,
            color: this.backgroundColor ?? "#999999",
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
      // Foundry V14 background.shiftX/Y use the texture-anchor convention:
      // positive offset moves the scene origin into the image, which visually
      // shifts the image left and lines up the painted grid line at
      // image-x = detection.offsetX with a Foundry grid edge.
      shiftX: Math.round(grid.offsetX),
      shiftY: Math.round(grid.offsetY),
      width: sceneWidth,
      height: sceneHeight,
      grid: { type: 1, size: gridSize, distance: 5, units: "ft" },
      folder: folderId,
      flags: {
        "ddbimporter": {
          mapId: this.map.id ?? null,
          imageKey: this.map.imageKey,
          thumbnailKey: this.map.thumbnailKey ?? null,
          sourceId: this.map.sourceId ?? this.map.officialData?.sourceId ?? null,
          chapterId: this.map.chapterId ?? this.map.officialData?.chapterId ?? null,
          tokenScale: this.map.tokenScale ?? null,
          gridSize,
          gridSource: grid.source,
          gridSceneScale: grid.sceneScale,
          gridMultiplier: getMapScaleMultiplier(),
          imageDimensions: dimensions,
          gridDetection: this.detection ?? null,
          gridCandidates: candidates,
          folderPath: this.options.folderPath ?? null,
          edgeBackgroundColor: this.backgroundColor ?? null,
        },
      },
    };

    logger.debug(`Creating scene for ${this.map.name}`, {
      data,
      map: this.map,
      grid,
      detection: this.detection,
    });
    this._notify(`Creating scene "${data.name}" (grid ${gridSize}px from ${grid.source})...`);
    this.scene = await Scene.create(data as any) as Scene;
    return this.scene;
  }

  // Find an existing scene that was previously imported from the same DDB
  // image. Match is by flag, not by name, because users often rename scenes.
  static findExistingScene(imageKey: string): any | null {
    if (!imageKey || !game?.scenes) return null;
    return game.scenes.find((s: any) =>
      foundry.utils.getProperty(s, "flags.ddbimporter.imageKey") === imageKey,
    ) ?? null;
  }

  private async _resolveDuplicateAction(existing: any): Promise<DuplicateAction> {
    const explicit = this.options.duplicateAction;
    if (explicit && explicit !== "ask") return explicit;
    const sceneName = existing?.name ?? this.map.name;
    const choice = await foundry.applications.api.DialogV2.wait({
      rejectClose: false,
      window: { title: "Map Already Imported" },
      content: `<p>"<strong>${sceneName}</strong>" was previously imported from this DDB map (image key matches an existing scene).</p>
        <p>What would you like to do?</p>`,
      buttons: [
        { action: "skip", label: "Skip", icon: "fas fa-forward", default: true, callback: () => "skip" },
        { action: "replace", label: "Replace", icon: "fas fa-rotate", callback: () => "replace" },
        { action: "create", label: "Import as New", icon: "fas fa-plus", callback: () => "create" },
        { action: "cancel", label: "Cancel", icon: "fas fa-times", callback: () => "cancel" },
      ],
    }) as DuplicateAction | "cancel" | null;
    if (choice === "cancel" || choice === null) return "skip";
    return choice;
  }

  async import(): Promise<IDDBMapImportResult> {
    try {
      const existing = DDBMap.findExistingScene(this.map.imageKey);
      if (existing) {
        const action = await this._resolveDuplicateAction(existing);
        if (action === "skip") {
          this._notify(`Skipped "${this.map.name}" (already imported as "${existing.name}").`);
          // V14: read the image path off the level rather than the deprecated Scene#background.
          const existingImagePath = ((existing.levels?.contents ?? existing.levels ?? [])[0]?.background?.src) ?? null;
          return { scene: existing, imagePath: existingImagePath, skipped: true, reason: "duplicate-skipped" };
        }
        if (action === "replace") {
          this._notify(`Replacing existing scene "${existing.name}"...`);
          try {
            await existing.delete();
          } catch (error) {
            logger.warn(`DDBMap.import: failed to delete existing scene "${existing.name}": ${(error as Error).message}`);
          }
        }
        // "create" falls through to a normal import alongside the existing.
      }

      await this.upload();
      if (!this.uploadedPath) {
        return { scene: null, imagePath: null, skipped: true, reason: "upload-failed" };
      }
      await this.createScene();
      await this._maybeApplyQuickplay();
      await this._maybeApplyQuickplayTokens();
      await this._maybeApplyMetaData();
      return { scene: this.scene, imagePath: this.uploadedPath, skipped: false };
    } catch (error) {
      logger.error(`DDBMap.import failed for ${this.map.name}: ${error.message}`, error);
      throw error;
    }
  }

  private _getBoolSetting(key: string): boolean {
    try {
      const v = utils.getSetting<boolean>(key);
      return typeof v === "boolean" ? v : false;
    } catch (_e) {
      return false;
    }
  }

  private _quickplayEnabled(): boolean {
    return this._getBoolSetting("munching-policy-maps-import-quickplay");
  }

  private _quickplayTokensEnabled(): boolean {
    return this._getBoolSetting("munching-policy-maps-import-quickplay-tokens");
  }

  // Fetch the prepared (Quickplay) state once per import and cache it. Both
  // sticker and token placement consume the same payload.
  private async _ensurePreparedState(): Promise<IDDBPreparedState | null> {
    if (this._preparedState !== undefined) return this._preparedState;
    const stateKey = this.map.preparedMap?.mapStateKey;
    if (!stateKey) {
      this._preparedState = null;
      return null;
    }
    this._notify(`Fetching Quickplay layout for ${this.map.name}...`);
    try {
      const state = await DDBMaps.fetchPreparedState({
        key: stateKey,
        cobalt: this.options.cobalt ?? null,
        campaignId: this.options.campaignId ?? null,
      });
      this._preparedState = state ?? null;
    } catch (error) {
      logger.warn(`DDBMap: Quickplay state fetch failed for "${this.map.name}": ${(error as Error).message}`);
      this._preparedState = null;
    }
    return this._preparedState;
  }

  // After the scene is created, optionally fetch the prepared (Quickplay)
  // state and place its stickers as Tile documents.
  private async _maybeApplyQuickplay() {
    if (!this.scene) return;
    if (!this._quickplayEnabled()) return;
    const state = await this._ensurePreparedState();
    if (!state) return;

    try {
      const result = await DDBQuickplay.applyToScene(this.scene, state, this.map.tokenScale, {
        cobalt: this.options.cobalt ?? null,
        campaignId: this.options.campaignId ?? null,
        notifier: this.options.notifier ?? null,
      });
      logger.info(`DDBMap: Quickplay applied to "${this.map.name}":`, result);
      try {
        await this.scene.update({
          flags: {
            "ddbimporter": {
              quickplayApplied: true,
              quickplayResult: result,
              mapStateKey: this.map.preparedMap?.mapStateKey ?? null,
            },
          },
        });
      } catch (error) {
        logger.warn(`DDBMap: failed to stamp Quickplay flags: ${(error as Error).message}`);
      }
    } catch (error) {
      logger.error(`DDBMap: Quickplay placement failed for "${this.map.name}": ${(error as Error).message}`, error);
    }
  }

  // Place Quickplay tokens after stickers. Reuses the cached prepared state.
  private async _maybeApplyQuickplayTokens() {
    if (!this.scene) return;
    if (!this._quickplayTokensEnabled()) return;
    const state = await this._ensurePreparedState();
    if (!state) return;

    const fallbackSetting = utils.getSetting<string>("munching-policy-maps-quickplay-tokens-fallback");
    const fallback: "skip" | "placeholder" = fallbackSetting === "placeholder" ? "placeholder" : "skip";
    const useDdbImage = this._getBoolSetting("munching-policy-maps-quickplay-token-use-ddb-image");

    // Mirror the scene folder structure for actors, but stop at the adventure
    // level (drop chapter and below). _folderPathForMap layers entries as
    // [type, source/adventure, chapter, ...], so cap at length 2.
    const sceneFolderPath = this.options.folderPath ?? null;
    const actorFolderPath = sceneFolderPath ? sceneFolderPath.slice(0, 2) : null;

    try {
      const result = await DDBQuickplayTokens.applyToScene(this.scene, state, {
        cobalt: this.options.cobalt ?? null,
        campaignId: this.options.campaignId ?? null,
        notifier: this.options.notifier ?? null,
        fallback,
        actorFolderPath,
        useDdbImage,
      });
      logger.info(`DDBMap: Quickplay tokens applied to "${this.map.name}":`, result);
      try {
        await this.scene.update({
          flags: {
            "ddbimporter": {
              quickplayTokensApplied: true,
              quickplayTokensResult: result,
            },
          },
        });
      } catch (error) {
        logger.warn(`DDBMap: failed to stamp Quickplay token flags: ${(error as Error).message}`);
      }
    } catch (error) {
      logger.error(`DDBMap: Quickplay token placement failed for "${this.map.name}": ${(error as Error).message}`, error);
    }
  }

  private _metaDataEnabled(): boolean {
    return this._getBoolSetting("munching-policy-maps-import-metadata");
  }

  // After Quickplay completes, optionally enrich the scene with community
  // walls/lights/tokens/grid pulled from MrPrimate/ddb-meta-data. Soft-fails
  // so a meta-data fetch error never blocks the underlying import.
  private async _maybeApplyMetaData() {
    if (!this.scene) return;
    if (!this._metaDataEnabled()) return;

    const sceneFolderPath = this.options.folderPath ?? null;
    const actorFolderPath = sceneFolderPath ? sceneFolderPath.slice(0, 2) : null;

    try {
      const results = await DDBMapMetaData.enrich(this.scene, this.map, {
        applyTokens: this._getBoolSetting("munching-policy-maps-metadata-tokens"),
        actorFolderPath,
        notifier: this.options.notifier ?? null,
      });
      if (results.length === 0) {
        logger.debug(`DDBMap: no meta-data match for "${this.map.name}"`);
      } else if (results.length === 1) {
        logger.info(`DDBMap: meta-data applied to "${this.map.name}":`, results[0]);
      } else {
        logger.info(`DDBMap: meta-data applied to "${this.map.name}" across ${results.length} scene${results.length === 1 ? "" : "s"}:`, results);
      }
    } catch (error) {
      logger.error(`DDBMap: meta-data enrichment failed for "${this.map.name}": ${(error as Error).message}`, error);
    }
  }

  static async importMap(map: IDDBMap, options: IDDBMapImportOptions = {}): Promise<IDDBMapImportResult> {
    return new DDBMap(map, options).import();
  }

  static async importMaps(maps: IDDBMap[], options: IDDBMapImportOptions = {}): Promise<IDDBMapImportResult[]> {
    const results: IDDBMapImportResult[] = [];
    for (const map of maps) {
      try {
        results.push(await DDBMap.importMap(map, options));
      } catch (error) {
        results.push({ scene: null, imagePath: null, skipped: true, reason: error.message });
      }
    }
    return results;
  }

  // Run a batch of imports with bounded concurrency. Download + grid detection
  // run in parallel up to `concurrency`; uploads serialize internally through
  // the shared upload chain so FilePicker isn't slammed. The optional
  // `onProgress` callback fires after each map completes (success or skip).
  static async importBatch(
    maps: IDDBMap[],
    options: IDDBMapImportOptions = {},
    onProgress?: (info: { index: number; total: number; map: IDDBMap; result: IDDBMapImportResult | null; error?: Error }) => void,
    concurrency = 4,
  ): Promise<IDDBMapImportResult[]> {
    const total = maps.length;
    const results: IDDBMapImportResult[] = new Array(total);
    let nextIdx = 0;
    let completed = 0;

    const worker = async () => {
      while (true) {
        const idx = nextIdx++;
        if (idx >= total) return;
        const map = maps[idx];
        try {
          const res = await DDBMap.importMap(map, options);
          results[idx] = res;
          completed += 1;
          onProgress?.({ index: completed, total, map, result: res });
        } catch (error) {
          const err = error as Error;
          results[idx] = { scene: null, imagePath: null, skipped: true, reason: err.message };
          completed += 1;
          onProgress?.({ index: completed, total, map, result: null, error: err });
        }
      }
    };

    const workerCount = Math.max(1, Math.min(concurrency, total));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
  }

}
