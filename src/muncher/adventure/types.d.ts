export {};

global {
  interface ITokenStub {
    x: number;
    y: number;
    hidden: boolean;
    locked: boolean;
    name: string;
    sort: number;
    level: string;
    flags: { "ddbimporter": Record<string, unknown> };
    // Optional HP delta carried through actor.getTokenDocument().
    delta?: { system?: { attributes?: { hp?: { value?: number; max?: number; temp?: number } } } };
    // Optional texture override, used when caller asks for the DDB placement art.
    texture?: { src: string };
  }

  interface ITileSourceData {
    texture: {
      src: string;
      anchorX: number;
      anchorY: number;
      fit: "cover" | "contain" | "fill";
      scaleX: number;
      scaleY: number;
    };
    width: number;
    height: number;
    x: number;
    y: number;
    rotation: number;
    levels: string[];
    sort: number;
    hidden: boolean;
    locked: boolean;
    flags: { "ddbimporter": Record<string, unknown> };
  }


  interface IDDBMetaScene {
    name?: string;
    width?: number;
    height?: number;
    padding?: number;
    grid?: {
      type?: number;
      size?: number;
      color?: string;
      alpha?: number;
      distance?: number;
      units?: string;
    };
    background?: {
      offsetX?: number;
      offsetY?: number;
      scaleX?: number;
      scaleY?: number;
      rotation?: number;
      tint?: string | null;
    };
    walls?: any[];
    lights?: any[];
    flags?: {
      ddb?: {
        tokens?: any[];
        [k: string]: any;
      };
      [k: string]: any;
    };
    [k: string]: any;
  }

  interface IDDBImporterSceneFlags {
    // Stamped at scene creation by DDBMap.
    mapId?: string | null;
    imageKey?: string;
    thumbnailKey?: string | null;
    sourceId?: string | null;
    chapterId?: string | null;
    tokenScale?: number | null;
    gridSize?: number;
    gridSource?: string;
    gridSceneScale?: number;
    gridMultiplier?: number;
    imageDimensions?: { x: number; y: number };
    gridDetection?: IGridDetectionResult | null;
    gridCandidates?: ICandidateSummary;
    folderPath?: string[] | null;
    edgeBackgroundColor?: string | null;

    // Stamped by Quickplay sticker pass.
    quickplayApplied?: boolean;
    quickplayResult?: IDDBQuickplayApplyResult;
    mapStateKey?: string | null;
    quickplayContext?: IQuickplayContext;
    quickplayTokens?: IDDBPreparedTokenEntityknown[];

    // Stamped by Quickplay token pass.
    quickplayTokensApplied?: boolean;
    quickplayTokensResult?: IDDBQuickplayTokensApplyResult;

    // Stamped by DDB Meta integration.
    metaDataApplied?: boolean;
    metaDataMatch?: IDDBMetaDataMatchInfo | null;
    metaDataResult?: IDDBMetaApplyResult;
    metaDataError?: string | null;
    metaDataReason?: string;

    // Stamped by AdventureMunch / ThirdPartyMunch.
    version?: string;
    export?: { actors?: boolean; compendium?: string };

    // Stamped by DDBEncounter for encounter-derived scenes.
    encounterId?: number | string;
    encounters?: boolean;
  }

  interface IQuickplayContext {
    cellPx: number;
    sceneScale: number;
    sceneOffsetX: number;
    sceneOffsetY: number;
    sceneXPad: number;
    sceneYPad: number;
    gridSize: number;
    anchor: "center" | "topLeft";
    stateImageWidth: number | null;
    stateImageHeight: number | null;
    stateTokenScale: number | null;
  }

  interface IMetaCache {
    // Per-map first-match cache used by the Map Browser badge.
    matches: Map<string, IDDBMetaMatchInfo | null>;
    // Full per-map match-info results from the proxy (multi-match maps surface
    // every match here, not just the first). The browser pre-warm and the
    // enrich path both read from this so a per-source warm covers later
    // imports without re-hitting the proxy.
    results: Map<string, IDDBMetaDataMatchResult>;
    inFlight: Map<string, Promise<IDDBMetaDataMatchResult | null>>;
  }


  interface IDDBMapImportResult {
    scene: any | null;
    imagePath: string | null;
    skipped: boolean;
    reason?: string;
  }

  type DuplicateAction = "ask" | "skip" | "replace" | "create";

  interface IDDBMapImportOptions {
    cobalt?: string | null;
    campaignId?: string | null;
    uploadPath?: string;
    notifier?: ((msg: string) => void) | null;
    // Names from outermost to innermost; e.g. ["Adventures", "Curse of Strahd",
    // "Chapter 2: The Lands of Barovia"]. The chain is created via
    // FolderHelper.getOrCreateFolder and the scene is filed under the leaf.
    folderPath?: string[];
    // Optional parallel sort indices for folderPath. When a value is present at
    // index i, the folder created (or reused) for folderPath[i] gets that as
    // its `sort` value (with manual sorting mode). Lets the caller order the
    // resulting folder tree to match an external layout - the Map Browser
    // uses this so type folders ("Adventures", "Map Packs", ...) appear in
    // the same order as in the catalog UI rather than alphabetically.
    folderSorts?: (number | null | undefined)[];
    // What to do when a scene with the same imageKey already exists.
    //   "ask"     - prompt the user (default for single imports)
    //   "skip"    - keep the existing scene, return reason "duplicate-skipped"
    //   "replace" - delete the existing scene before creating a fresh one
    //   "create"  - import alongside the existing scene
    duplicateAction?: DuplicateAction;
  }

  interface IDDBQuickplayApplyOptions {
    cobalt?: string | null;
    campaignId?: string | null;
    notifier?: ((msg: string) => void) | null;
    // Centre-vs-top-left position convention for sticker placements. DDB
    // appears to store the sticker's centre, but expose this as an option in
    // case future layouts disagree.
    positionAnchor?: "center" | "topLeft";
    // Concurrency for sticker downloads (FilePicker uploads serialise via
    // DDBSticker._uploadChain regardless of this value).
    concurrency?: number;
  }

  interface IDDBQuickplayApplyResult {
    tilesCreated: number;
    tilesFailed: number;
    stickersImported: number;
    stickersFailed: number;
  }


  interface IDDBQuickplayTokensApplyOptions {
    cobalt?: string | null;
    campaignId?: string | null;
    notifier?: ((msg: string) => void) | null;
    // What to do when a sticker's `entityId` isn't in the local monster
    // compendium and can't be auto-imported (e.g., user has no Patreon access).
    //   "skip"        - omit the token entirely (default)
    //   "placeholder" - place a token without an actor link, just for visuals
    fallback?: "skip" | "placeholder";
    // If true, suppress the auto-fetch of missing monsters from DDB and only use
    // what's already in the local monster compendium.
    noAutoImport?: boolean;
    // What to do when the scene already has Quickplay tokens placed.
    //   "skip"    - return early without changes (default)
    //   "augment" - place anything whose `quickplayTokenId` isn't already there
    //   "replace" - delete existing Quickplay tokens before placing new ones
    duplicates?: "skip" | "augment" | "replace";
    // Outermost-to-innermost folder names for filing imported world actors. Used
    // verbatim - DDBMap caps the chain at adventure level before passing it in.
    // Falsy/empty entries skipped, null leaves actors at the root.
    actorFolderPath?: string[] | null;
    // If true, override each placed token's texture.src with the DDB-supplied
    // imageUrl (full-size art for that placement) instead of the prototype
    // token's avatar. Falls back to the prototype when the URL is missing.
    useDdbImage?: boolean;
  }

  interface IDDBQuickplayTokensApplyResult {
    tokensCreated: number;
    tokensSkipped: number;
    tokensFailed: number;
    monstersImported: number;
    monstersMissing: number;
  }


  interface IDDBStickerImportResult {
    imagePath: string | null;
    metaPath: string | null;
    filename: string | null;
    skipped: boolean;
    reason?: string;
  }

  interface IDDBStickerImportOptions {
    cobalt?: string | null;
    campaignId?: string | null;
    uploadPath?: string;
    notifier?: ((msg: string) => void) | null;
    // The display name of the source/set this sticker belongs to. Used to
    // build the per-set folder name. Defaults to "source-<id>" when not given.
    setName?: string | null;
  }

  interface IDDBStickerMetaEntry {
    id: string;
    name: string;
    altText: string | null;
    keywords: string[];
    imageKey: string;
    thumbnailKey: string | null;
    aspectRatio: number | null;
    scale: number | null;
    importedAt: number;
  }

  interface IDDBStickerSetMeta {
    setId: number | null;
    setName: string;
    fetchedAt: number;
    stickers: Record<string, IDDBStickerMetaEntry>;
  }

  // The proxy owns the meta-data tarball + match cache. The match endpoint
  // returns the lightweight match info (no scene JSON); apply pulls the full
  // scene contents via a separate scenes endpoint only when needed.
  export type IDDBMetaMatch = IDDBMetaDataMatch;
  export type IDDBMetaMatchInfo = IDDBMetaDataMatchInfo;


  export interface IDDBMetaApplyOptions {
    applyTokens: boolean;
    actorFolderPath?: string[] | null;
    notifier?: ((msg: string) => void) | null;
    noAutoImport?: boolean;
    /** 2014→2024 monster swap (native importer): remap scene-token actor ids/names. */
    monsterSwap?: Map<number, { id2024: number; name2024: string }>;
  }

  export interface IDDBMetaApplyResult {
    match: IDDBMetaMatch;
    sceneMerged: boolean;
    walls: number;
    lights: number;
    drawings: number;
    notes: number;
    tokens: { created: number; missing: number; imported: number; failed: number };
    quickplayTokensRemoved: number;
    quickplayTilesPreserved: number;
  }


}
