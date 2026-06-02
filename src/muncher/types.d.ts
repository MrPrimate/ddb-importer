export {};

global {


  type DDBMapSourceType = "adventure" | "sourcebook" | "mappack" | "basic" | "subscription" | string;

  interface IDDBMapSourceCategory {
    id: string;
    name: string;
    order?: number;
    backgroundImageKey?: string;
    // True when DDB flags this category as containing Quickplay maps. Catalog
    // returns it directly so we can show a tag in the sidebar without loading
    // the per-source maps payload first.
    hasQuickplay?: boolean;
  }

  interface IDDBMapSource {
    sourceId: string;
    name: string;
    description: string;
    type: DDBMapSourceType;
    backgroundImageKey: string;
    backgroundImage?: string | null;
    released?: boolean;
    categories?: IDDBMapSourceCategory[];
    // True when DDB flags this source as containing Quickplay maps. Surfaced
    // by the proxy flatten step from the raw catalog payload.
    hasQuickplay?: boolean;
  }

  interface IDDBMapDimensions {
    x: number;
    y: number;
  }

  interface IDDBPreparedMap {
    readyToPublish?: boolean;
    description?: string;
    mapStateKey?: string;
  }

  // One placed sticker inside a Quickplay/prepared scene state. Position units
  // are grid squares from the image's top-left; size is also in grid squares;
  // height is derived as `size / aspectRatio`. tokenScale on the parent state
  // gives the cell width in image pixels (cellPx = imageWidth * tokenScale).
  interface IDDBPreparedStickerEntity {
    id: string;
    type: string;
    name: string;
    imageKey: string;
    thumbnailKey?: string;
    position: [number, number];
    size: number;
    aspectRatio: number;
    rotation: number;
    zPosition: number;
    hidden?: boolean;
    locked?: boolean;
  }

  interface IDDBPreparedNormalised<T> {
    entities: Record<string, T>;
    ids: string[];
  }

  // One placed token inside a Quickplay/prepared scene state. `entityId` is
  // the DDB monster id - matches the catalogued monster's flags.ddbimporter.id
  // in the local compendium so we can resolve tokens back to actors.
  interface IDDBPreparedTokenEntity {
    id: string;
    type: string;                    // "MONSTER" | "PLAYER" | ...
    name: string;
    displayName?: string | null;
    nameSuffix?: string | null;
    entityId: number;
    entitySizeId?: number;
    sourceId?: number;
    sourceName?: string;
    imageUrl?: string;
    fallbackImageUrl?: string;
    borderColor?: string | null;
    hpInfo?: {
      current?: number | null;
      max?: number | null;
      maxOverride?: number | null;
      temp?: number | null;
    };
    hidden?: boolean;
    locked?: boolean;
    position: [number, number];
    zPosition?: number;
  }

  interface IDDBPreparedState {
    scenarioId: string;
    imageKey: string;
    imageUrl?: string;
    size: { width: number; height: number };
    tokenScale?: number;
    stickers?: IDDBPreparedNormalised<IDDBPreparedStickerEntity>;
    overlays?: IDDBPreparedNormalised<unknown>;
    tokens?: IDDBPreparedNormalised<IDDBPreparedTokenEntity>;
    fogImageKey?: string;
    drawImageKey?: string | null;
    tokenMaxZPosition?: number;
  }

  // Per-source maps carry an S3 thumbnail URL (small preview, ~1 hour expiry) plus the `imageKey`
  interface IDDBMap {
    id: string;
    name: string;
    description?: string;
    sourceId?: string;
    sourceName?: string;
    sourceDescription?: string;
    sourceType?: DDBMapSourceType;
    chapterId?: string;
    imageKey: string;
    thumbnailKey?: string;
    thumbnail?: string | null;
    imageDimensions?: IDDBMapDimensions;
    tokenScale?: number;
    order?: number;
    preparedMap?: IDDBPreparedMap;
    officialData?: { sourceId?: string; chapterId?: string };
  }

  interface IDDBMapCatalog {
    sources: IDDBMapSource[];
    // Sorted list of every action name DDB exposes via the games page chunks.
    // Kept around because action discovery is the most fragile part of the
    // catalog pipeline and this lets us spot upstream renames quickly.
    _allActionNames?: string[];
    // sourceIds returned by getEntitledSourcesAndPreparedMaps that have at
    // least one prepared (Quickplay) map. Mirrors the per-source hasQuickplay
    // flag the flatten step stamps onto each IDDBMapSource.
    _preparedSourceIds?: string[];
  }

  interface IDDBChapterDescriptor {
    id: string;
    name: string;
    order?: number;
  }

  interface IDDBSourceMapGroup {
    PartitionKey?: string;
    // SortKey is shaped like "sourceId_<n>#chapter_<id>#maps" - the chapter id
    // is the only place chapter linkage lives on adventure responses (the per-
    // map objects don't carry chapterId at all).
    SortKey?: string;
    lastUpdated?: number;
    maps: IDDBMap[];
  }

  interface IDDBSourceMaps {
    chapters?: { chapters?: IDDBChapterDescriptor[] };
    maps?: IDDBSourceMapGroup[] | IDDBMap[];
  }

  interface IDDBScenarioMap extends IDDBMap {
    signedUrl?: string | null;
    signError?: string;
  }

  interface IDDBScenario {
    id: string;
    name: string;
    maps: IDDBScenarioMap[];
  }

  interface IDDBScenariosPayload {
    scenarios: IDDBScenario[];
  }

  interface IDDBProxyResponse<T> {
    success: boolean;
    message: string;
    data?: T;
  }

  // Item shape returned by the /proxy/library fallback (the owned-content
  // lookup used when /proxy/adventure/available-user-content is bot-blocked).
  // The library `id` matches CONFIG.DDB.sources id, so it maps straight to the
  // bookIds the primary endpoint returns. Only id + isOwned are consumed.
  interface ILibraryItem {
    id: number;
    name: string;
    isOwned: boolean;
    isReleased: boolean;
    relativePath: string;
  }

  // Lightweight match info returned by /proxy/maps/metadata/match. No scene
  // JSON - just enough to show a badge and decide whether to fetch.
  interface IDDBMetaDataMatchInfo {
    bookCode: string;
    filepath: string;
    matchedBy: "filename" | "name" | "hint";
    sceneName?: string | null;
  }

  // Heavier match payload after the scene-info JSON has been fetched. Used
  // during the apply path only.
  interface IDDBMetaDataMatch extends IDDBMetaDataMatchInfo {
    scene: any;
  }

  // Match-only result from the /match endpoint - one of these per request.
  interface IDDBMetaDataMatchResult {
    matches: IDDBMetaDataMatchInfo[];
    reason: string;
    ambiguous?: string[];
  }

  // Per-ref scene-info payload from the /scenes endpoint.
  interface IDDBMetaDataSceneFetch {
    bookCode: string;
    filepath: string;
    scene: any | null;
    error?: string;
  }


  interface IDDBStickerEntitledData {
    imageKey: string;
    aspectRatio?: number;
    scale?: number;
  }

  interface IDDBSticker {
    gameElementUri: string;
    name: string;
    altText?: string;
    keywords?: string[];
    primarySourceId?: number;
    thumbnailKey?: string;
    thumbnail?: string | null;
    entitledData?: IDDBStickerEntitledData;
  }

  interface IDDBStickersPayload {
    stickers: IDDBSticker[];
  }

}
