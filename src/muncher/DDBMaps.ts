import { logger, DDBProxy, PatreonHelper, Secrets, utils } from "../lib/_module";

export type DDBMapSourceType = "adventure" | "sourcebook" | "mappack" | "basic" | "subscription" | string;

export interface IDDBMapSourceCategory {
  id: string;
  name: string;
  order?: number;
  backgroundImageKey?: string;
  // True when DDB flags this category as containing Quickplay maps. Catalog
  // returns it directly so we can show a tag in the sidebar without loading
  // the per-source maps payload first.
  hasQuickplay?: boolean;
}

export interface IDDBMapSource {
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
  // Count of prepared (Quickplay) maps for this source, derived from the
  // getEntitledSourcesAndPreparedMaps response in the proxy. This is NOT
  // the total scene count - DDB doesn't expose that at catalog time -
  // so this can't be used as an "is source empty" signal.
  preparedMapCount?: number;
}

export interface IDDBMapDimensions {
  x: number;
  y: number;
}

export interface IDDBPreparedMap {
  readyToPublish?: boolean;
  description?: string;
  mapStateKey?: string;
}

// One placed sticker inside a Quickplay/prepared scene state. Position units
// are grid squares from the image's top-left; size is also in grid squares;
// height is derived as `size / aspectRatio`. tokenScale on the parent state
// gives the cell width in image pixels (cellPx = imageWidth * tokenScale).
export interface IDDBPreparedStickerEntity {
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

export interface IDDBPreparedNormalised<T> {
  entities: Record<string, T>;
  ids: string[];
}

// One placed token inside a Quickplay/prepared scene state. `entityId` is
// the DDB monster id - matches the catalogued monster's flags.ddbimporter.id
// in the local compendium so we can resolve tokens back to actors.
export interface IDDBPreparedTokenEntity {
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

export interface IDDBPreparedState {
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
export interface IDDBMap {
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

export interface IDDBMapCatalog {
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

export interface IDDBChapterDescriptor {
  id: string;
  name: string;
  order?: number;
}

export interface IDDBSourceMapGroup {
  PartitionKey?: string;
  // SortKey is shaped like "sourceId_<n>#chapter_<id>#maps" - the chapter id
  // is the only place chapter linkage lives on adventure responses (the per-
  // map objects don't carry chapterId at all).
  SortKey?: string;
  lastUpdated?: number;
  maps: IDDBMap[];
}

// Extract the chapter id encoded in a wrapper's SortKey, e.g.
//   "sourceId_6#chapter_0#maps" -> "0"
// Returns null when the SortKey is missing or doesn't contain a chapter slot.
export function chapterIdFromSortKey(sortKey: string | null | undefined): string | null {
  if (!sortKey) return null;
  const match = sortKey.match(/#chapter_([^#]+)/);
  return match ? match[1] : null;
}

export default class DDBMaps {

  static getCampaignId(override: string | null = null): string {
    if (override && `${override}`.trim() !== "") return `${override}`;
    // Maps has its own campaign-id setting separate from the global
    // campaign-id - DDB Maps content is licensed per-campaign and users
    // commonly want a different scope here than for character/encounter
    // sync. Fall back to the global setting when the maps-specific value
    // hasn't been set.
    let mapsCampaignId = "";
    try {
      mapsCampaignId = (utils.getSetting<string>("ddb-maps-campaign-id") ?? "").toString().trim();
    } catch (_e) { /* fall through */ }
    if (!mapsCampaignId || `${mapsCampaignId}`.trim() === "") {
      logger.error("DDBMaps: no campaignId set");
      return "";
    }
    return `${mapsCampaignId}`;
  }

  private static buildBody(extra: Record<string, unknown> = {}, cobalt: string | null = null): Record<string, unknown> {
    return {
      cobalt: cobalt ?? Secrets.getCobalt(),
      betaKey: PatreonHelper.getPatreonKey(),
      ...extra,
    };
  }

  private static async post<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
    const parsingApi = DDBProxy.getProxy();
    try {
      const response = await fetch(`${parsingApi}${path}`, {
        method: "POST",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: IDDBProxyResponse<T> = await response.json();
      if (!data.success) {
        logger.error(`DDBMaps ${path} failed: ${data.message}`, data);
        return null;
      }
      return (data.data ?? null) as T | null;
    } catch (error) {
      logger.error(`DDBMaps ${path} error: ${error}`);
      throw error;
    }
  }

  static async fetchCatalog({
    cobalt = null,
    campaignId = null,
  }: { cobalt?: string | null; campaignId?: string | null } = {}): Promise<IDDBMapCatalog | null> {
    const resolvedCampaignId = DDBMaps.getCampaignId(campaignId);
    if (!resolvedCampaignId) return null;
    const body = DDBMaps.buildBody({ campaignId: resolvedCampaignId, flatten: true }, cobalt);
    return DDBMaps.post<IDDBMapCatalog>("/proxy/maps/catalog", body);
  }

  static async fetchSourceMaps({
    sourceId,
    chapterId = null,
    cobalt = null,
    campaignId = null,
  }: {
    sourceId: string;
    chapterId?: string | null;
    cobalt?: string | null;
    campaignId?: string | null;
  }): Promise<IDDBSourceMaps | null> {
    if (!sourceId) {
      logger.error("DDBMaps.fetchSourceMaps: sourceId is required");
      return null;
    }
    const resolvedCampaignId = DDBMaps.getCampaignId(campaignId);
    if (!resolvedCampaignId) return null;
    const body = DDBMaps.buildBody(
      { campaignId: resolvedCampaignId, sourceId, chapterId },
      cobalt,
    );
    return DDBMaps.post<IDDBSourceMaps>("/proxy/maps/source", body);
  }

  // Fetch the prepared (Quickplay) scene state JSON for a map. The proxy
  // signs `mapStateKey` and returns the parsed JSON.
  static async fetchPreparedState({
    key,
    cobalt = null,
    campaignId = null,
  }: { key: string; cobalt?: string | null; campaignId?: string | null }): Promise<IDDBPreparedState | null> {
    if (!key) {
      logger.error("DDBMaps.fetchPreparedState: key is required");
      return null;
    }
    const resolvedCampaignId = DDBMaps.getCampaignId(campaignId);
    if (!resolvedCampaignId) return null;
    const body = DDBMaps.buildBody({ campaignId: resolvedCampaignId, key }, cobalt);
    return DDBMaps.post<IDDBPreparedState>("/proxy/maps/state", body);
  }

  static async fetchScenarios({
    cobalt = null,
    campaignId = null,
    sign = true,
  }: { cobalt?: string | null; campaignId?: string | null; sign?: boolean } = {}): Promise<IDDBScenariosPayload | null> {
    const resolvedCampaignId = DDBMaps.getCampaignId(campaignId);
    if (!resolvedCampaignId) return null;
    const body = DDBMaps.buildBody({ campaignId: resolvedCampaignId, sign }, cobalt);
    return DDBMaps.post<IDDBScenariosPayload>("/proxy/maps", body);
  }

  // Match-only call: ask the proxy whether a given map has a community
  // meta-data entry. Returns the lightweight match info (no scene JSON), so
  // the Map Browser can render badges without pulling MB-scale payloads.
  // The proxy caches this response per request signature.
  static async fetchMetaMatch({
    bookCode = null,
    sourceId = null,
    name = null,
    filename = null,
    parentId = null,
    contentChunkId = null,
    ddbId = null,
    missing = null,
    cobalt = null,
  }: {
    bookCode?: string | null;
    sourceId?: string | number | null;
    name?: string | null;
    filename?: string | null;
    parentId?: string | number | null;
    contentChunkId?: string | null;
    ddbId?: string | number | null;
    missing?: boolean | null;
    cobalt?: string | null;
  } = {}): Promise<IDDBMetaDataMatchResult | null> {
    const body = DDBMaps.buildBody({ bookCode, sourceId, name, filename, parentId, contentChunkId, ddbId, missing }, cobalt);
    return DDBMaps.post<IDDBMetaDataMatchResult>("/proxy/maps/metadata/match", body);
  }

  // Batched match call - sends a list of requests in one HTTP. The response
  // is positionally aligned with the input. Used by the Map Browser to
  // pre-warm match badges for a whole source in a single round-trip.
  static async fetchMetaMatchBatch(
    requests: {
      bookCode?: string | null;
      sourceId?: string | number | null;
      name?: string | null;
      filename?: string | null;
    }[],
    { cobalt = null }: { cobalt?: string | null } = {},
  ): Promise<IDDBMetaDataMatchResult[] | null> {
    if (!Array.isArray(requests) || requests.length === 0) return [];
    const body = DDBMaps.buildBody({ requests }, cobalt);
    const data = await DDBMaps.post<{ results: IDDBMetaDataMatchResult[] }>("/proxy/maps/metadata/match", body);
    return data?.results ?? null;
  }

  // Fetch the heavy scene-info JSON(s) for explicit refs. NOT cached at the
  // proxy API level - call this only when the user is actually importing
  // (or re-importing) a map.
  static async fetchMetaSceneInfos(
    refs: { bookCode: string; filepath: string }[],
    { cobalt = null }: { cobalt?: string | null } = {},
  ): Promise<IDDBMetaDataSceneFetch[] | null> {
    if (!Array.isArray(refs) || refs.length === 0) return [];
    const body = DDBMaps.buildBody({ refs }, cobalt);
    const data = await DDBMaps.post<{ scenes: IDDBMetaDataSceneFetch[] }>("/proxy/maps/metadata/scenes", body);
    return data?.scenes ?? null;
  }

  static async downloadImage({
    key,
    cobalt = null,
    campaignId = null,
  }: { key: string; cobalt?: string | null; campaignId?: string | null }): Promise<Blob | null> {
    const resolvedCampaignId = DDBMaps.getCampaignId(campaignId);
    if (!resolvedCampaignId) return null;
    if (!key) {
      logger.error("DDBMaps.downloadImage: no key supplied");
      return null;
    }
    const parsingApi = DDBProxy.getProxy();
    const body = DDBMaps.buildBody({ campaignId: resolvedCampaignId, key }, cobalt);
    try {
      const response = await fetch(`${parsingApi}/proxy/maps/download`, {
        method: "POST",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const contentType = response.headers.get("content-type") || "";
      // Treat any JSON response (whether status was ok or not) as an error envelope.
      if (contentType.includes("application/json")) {
        let message = `HTTP ${response.status}`;
        try {
          const json = await response.json();
          if (json?.message) message = json.message;
        } catch (_e) { /* keep status-only message */ }
        logger.error(`DDBMaps.downloadImage failed: ${message}`);
        return null;
      }
      if (!response.ok) {
        logger.error(`DDBMaps.downloadImage failed: HTTP ${response.status}`);
        return null;
      }
      return await response.blob();
    } catch (error) {
      logger.error(`DDBMaps.downloadImage error: ${error}`);
      throw error;
    }
  }

  // Stream a Quickplay token image through the proxy. The proxy applies host
  // allowlisting + cobalt cookie attachment so direct URL fetches that would
  // be blocked by CORS or auth still resolve.
  static async downloadTokenImage({
    url,
    cobalt = null,
    campaignId = null,
  }: { url: string; cobalt?: string | null; campaignId?: string | null }): Promise<Blob | null> {
    const resolvedCampaignId = DDBMaps.getCampaignId(campaignId);
    if (!resolvedCampaignId) return null;
    if (!url) {
      logger.error("DDBMaps.downloadTokenImage: no url supplied");
      return null;
    }
    const parsingApi = DDBProxy.getProxy();
    const body = DDBMaps.buildBody({ campaignId: resolvedCampaignId, url }, cobalt);
    try {
      const response = await fetch(`${parsingApi}/proxy/maps/token-image`, {
        method: "POST",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        let message = `HTTP ${response.status}`;
        try {
          const json = await response.json();
          if (json?.message) message = json.message;
        } catch (_e) { /* keep status-only message */ }
        logger.error(`DDBMaps.downloadTokenImage failed: ${message}`);
        return null;
      }
      if (!response.ok) {
        logger.error(`DDBMaps.downloadTokenImage failed: HTTP ${response.status}`);
        return null;
      }
      return await response.blob();
    } catch (error) {
      logger.error(`DDBMaps.downloadTokenImage error: ${error}`);
      throw error;
    }
  }

  static listSources(catalog: IDDBMapCatalog | null): IDDBMapSource[] {
    if (!catalog) return [];
    return [...catalog.sources];
  }

  static groupSourcesByType(catalog: IDDBMapCatalog | null): Record<string, IDDBMapSource[]> {
    const groups: Record<string, IDDBMapSource[]> = {};
    if (!catalog) return groups;
    for (const src of catalog.sources) {
      const type = src.type || "other";
      (groups[type] ??= []).push(src);
    }
    return groups;
  }

  static flattenSourceMaps(payload: IDDBSourceMaps | null): IDDBMap[] {
    if (!payload || !payload.maps) return [];
    if (Array.isArray(payload.maps) && payload.maps.length && (payload.maps as IDDBSourceMapGroup[])[0]?.maps !== undefined) {
      return (payload.maps as IDDBSourceMapGroup[]).flatMap((g) => {
        const wrapperChapter = chapterIdFromSortKey(g.SortKey);
        return (g.maps ?? []).map((m) => {
          const cid = m.chapterId ?? m.officialData?.chapterId ?? wrapperChapter;
          return cid ? { ...m, chapterId: cid } : m;
        });
      });
    }
    return payload.maps as IDDBMap[];
  }

  // Resolve a chapter id to a human-readable name from the payload's chapters
  // list. Returns null when the chapter is unknown.
  static chapterNameFor(payload: IDDBSourceMaps | null, chapterId: string | null | undefined): string | null {
    if (!payload || !chapterId) return null;
    const chap = payload.chapters?.chapters?.find((c) => c.id === chapterId);
    return chap?.name ?? null;
  }

  // Walk the source maps payload and group by chapter. For wrapped responses,
  // the chapter id lives on the wrapper's SortKey (encoded as
  // "sourceId_<n>#chapter_<id>#maps"). For flat responses we fall back to
  // per-map chapterId / officialData.chapterId. PartitionKey is intentionally
  // ignored - in practice it's just the source-type tag ("official").
  static groupSourceMaps(payload: IDDBSourceMaps | null): { chapterId: string | null; maps: IDDBMap[] }[] {
    if (!payload || !payload.maps) return [];

    const resolveChapterIdFromMap = (m: IDDBMap): string | null => {
      return m.chapterId ?? m.officialData?.chapterId ?? null;
    };

    const byChapter = new Map<string | null, IDDBMap[]>();
    const order: (string | null)[] = [];
    const push = (id: string | null, m: IDDBMap) => {
      if (!byChapter.has(id)) {
        byChapter.set(id, []);
        order.push(id);
      }
      byChapter.get(id)!.push(m);
    };

    const wrapped = Array.isArray(payload.maps)
      && payload.maps.length > 0
      && (payload.maps as IDDBSourceMapGroup[])[0]?.maps !== undefined;
    if (wrapped) {
      for (const grp of payload.maps as IDDBSourceMapGroup[]) {
        const wrapperChapter = chapterIdFromSortKey(grp.SortKey);
        for (const m of grp.maps ?? []) {
          push(wrapperChapter ?? resolveChapterIdFromMap(m), m);
        }
      }
    } else {
      for (const m of payload.maps as IDDBMap[]) {
        push(resolveChapterIdFromMap(m), m);
      }
    }

    return order.map((id) => ({ chapterId: id, maps: byChapter.get(id)! }));
  }

}
