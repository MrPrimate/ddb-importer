import { logger, CompendiumHelper, FolderHelper, FileHelper, Iconizer } from "../../lib/_module";
import DDBMaps from "../DDBMaps";
import AdventureMunch, { DEFAULT_LEVEL_ID } from "./AdventureMunch";
import AdventureMunchHelpers from "./AdventureMunchHelpers";

const META_NOTES_ADVENTURE_NAME = "ddb-meta-data";
const META_NOTES_JOURNAL_NAME = "DDB Meta-Data Notes";

function _cache(): IMetaCache {
  if (!CONFIG.DDBI.META) {
    CONFIG.DDBI.META = {
      matches: new Map(),
      results: new Map(),
      inFlight: new Map(),
    };
  }
  // Defensive shim for cache objects created by older versions of this file.
  const c = CONFIG.DDBI.META as Partial<IMetaCache>;
  if (!c.matches) c.matches = new Map();
  if (!c.results) c.results = new Map();
  if (!c.inFlight) c.inFlight = new Map();
  return c as IMetaCache;
}

// Pull the bookCode out of an S3 imageKey of the form
// "official/maps/<bookCode>/<filename>". Returns null on no match.
function _bookCodeFromImageKey(imageKey: string | null | undefined): string | null {
  if (!imageKey) return null;
  const m = imageKey.match(/^official\/maps\/([^/]+)\//i);
  if (!m) return null;
  return m[1].toLowerCase();
}

// Resolve a bookCode for the map. DDB does not consistently populate
// `IDDBMap.sourceId` (it's set on the source wrapper, not stamped on each map
// by flattenSourceMaps), so prefer the imageKey path, which always contains
// the book code for official maps. Fall back to sourceId -> CONFIG.DDB.sources
// for third-party or custom payloads where the imageKey path differs.
export function resolveMapBookCode(map: IDDBMap): string | null {
  const fromImage = _bookCodeFromImageKey(map.imageKey);
  if (fromImage) return fromImage;
  const raw = map.sourceId ?? map.officialData?.sourceId;
  const sid = Number(raw);
  if (!Number.isFinite(sid)) return null;
  const source = CONFIG.DDB?.sources?.find?.((s) => s.id === sid);
  const name = source?.name;
  return name ? String(name).toLowerCase() : null;
}

function _normaliseName(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim();
}

// Drop the trailing "(Player/Unlabeled/Ungridded/Map Version)" suffix before a
// name comparison (mirrors NativeSceneApplier.stripSuffix) so a player-version
// scene still matches a metadata variant named without the suffix.
function _stripVersionSuffix(s: string | null | undefined): string {
  return (s ?? "").replace(/\s*\((Player|Unlabeled|Ungridded|Map) Version\)\s*$/i, "").trim();
}

// Tidy nav-bar label from a scene name: drop a "Chapter: " prefix then any
// parenthetical suffix (mirrors NativeSceneBuilder's navName derivation). Falls
// back to the un-stripped base when a wholly-bracketed name strips to empty.
function _navNameFromName(name: string | null | undefined): string {
  const base = (name ?? "").split(":").pop()?.trim() ?? (name ?? "");
  return base.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim() || base;
}

function _filenameFromImageKey(imageKey: string | null | undefined): string | null {
  if (!imageKey) return null;
  const last = imageKey.split("/").pop();
  if (!last) return null;
  // Strip query string if any.
  const noQuery = last.split("?")[0];
  return noQuery.toLowerCase();
}

// Build the proxy request payload for a given map. The proxy supports any
// subset of the four identifiers; sending them all lets it pick the best
// hint match.
function _proxyRequestForMap(map: IDDBMap): {
  bookCode: string | null;
  sourceId: string | number | null;
  name: string | null;
  filename: string | null;
  parentId: number | string | null;
  contentChunkId: string | null;
  ddbId: number | string | null;
  missing: boolean | null;
} {
  return {
    bookCode: resolveMapBookCode(map),
    sourceId: map.sourceId ?? map.officialData?.sourceId ?? null,
    name: map.name ?? null,
    filename: _filenameFromImageKey(map.imageKey),
    // parentId (DDB ParentID) is the cross-muncher-stable join the proxy keys on,
    // with filename; contentChunkId/ddbId are secondary disambiguators. ddbId is
    // the DDB content-row id - note the proxy metadata's own ddbId is a different
    // (sequential) id, so it only ever helps as a last-resort tie-break.
    parentId: (map as any).parentId ?? (map as any).flags?.ddb?.parentId ?? null,
    contentChunkId: (map as any).contentChunkId ?? (map as any).flags?.ddb?.contentChunkId ?? null,
    ddbId: (map as any).ddbId ?? (map as any).flags?.ddb?.ddbId ?? null,
    // Restrict the proxy to missing-vs-non-missing metadata: a missing scene's
    // background is the player image, whose filename collides with the
    // non-missing entry sharing it - filename matching would pull the wrong one.
    missing: typeof (map as any).missing === "boolean"
      ? (map as any).missing
      : ((map as any).flags?.ddb?.source != null ? (map as any).flags.ddb.source === "missing" : null),
  };
}

export default class DDBMapMetaData {

  // -------- proxy match lookup + per-session cache --------

  // Ask the proxy whether this map has community meta-data. Returns the
  // lightweight match-info payload (no scene JSON). Results are cached per
  // map for the rest of the session so the import path can reuse what the
  // browser badge already resolved.
  static async fetchMatchInfo(map: IDDBMap): Promise<IDDBMetaDataMatchResult | null> {
    const cache = _cache();
    const cacheKey = map.id ?? map.imageKey;
    if (cacheKey && cache.results.has(cacheKey)) {
      return cache.results.get(cacheKey) ?? null;
    }
    if (cacheKey && cache.inFlight.has(cacheKey)) {
      return cache.inFlight.get(cacheKey) ?? null;
    }

    const req = _proxyRequestForMap(map);
    logger.info(`DDBMapMetaData.fetchMatchInfo: querying proxy for "${map.name}"`, req);

    const promise = (async (): Promise<IDDBMetaDataMatchResult | null> => {
      try {
        const result = await DDBMaps.fetchMetaMatch(req);
        if (!result) {
          logger.info(`DDBMapMetaData.fetchMatchInfo: proxy returned no result for "${map.name}"`);
          return null;
        }
        logger.info(
          `DDBMapMetaData.fetchMatchInfo: proxy returned ${result.matches.length} match${result.matches.length === 1 ? "" : "es"} for "${map.name}" (reason: ${result.reason})`,
          result.matches,
        );
        if (cacheKey) {
          cache.results.set(cacheKey, result);
          cache.matches.set(cacheKey, result.matches[0] ?? null);
        }
        return result;
      } catch (error) {
        logger.warn(`DDBMapMetaData.fetchMatchInfo: proxy call failed for "${map.name}": ${(error as Error).message ?? error}`);
        return null;
      } finally {
        if (cacheKey) cache.inFlight.delete(cacheKey);
      }
    })();
    if (cacheKey) cache.inFlight.set(cacheKey, promise);
    return promise;
  }

  static clearCache(): void {
    const cache = _cache();
    cache.matches.clear();
    cache.results.clear();
    cache.inFlight.clear();
  }

  // -------- matching (browser badge integration) --------

  static async findMatchesForMaps(maps: IDDBMap[]): Promise<Map<string, IDDBMetaMatchInfo | null>> {
    const cache = _cache();
    logger.info(`DDBMapMetaData.findMatchesForMaps: resolving meta matches for ${maps.length} map${maps.length === 1 ? "" : "s"}`);

    // Split the input into cached vs uncached. We only round-trip to the
    // proxy for the uncached ones, but in a single batched call instead of
    // N sequential HTTPs.
    const uncached: { map: IDDBMap; key: string; request: ReturnType<typeof _proxyRequestForMap> }[] = [];
    let cachedHits = 0;
    for (const map of maps) {
      const key = map.id ?? map.imageKey;
      if (!key) continue;
      if (cache.matches.has(key)) {
        cachedHits += 1;
        continue;
      }
      uncached.push({ map, key, request: _proxyRequestForMap(map) });
    }

    let hits = 0;
    let misses = 0;
    if (uncached.length) {
      logger.info(`DDBMapMetaData.findMatchesForMaps: batching ${uncached.length} match requests to proxy`);
      let batchResults: IDDBMetaDataMatchResult[] | null = null;
      try {
        batchResults = await DDBMaps.fetchMetaMatchBatch(uncached.map((u) => u.request));
      } catch (error) {
        logger.warn(`DDBMapMetaData.findMatchesForMaps: batch match fetch failed: ${(error as Error).message ?? error}`);
      }
      if (!Array.isArray(batchResults) || batchResults.length !== uncached.length) {
        if (batchResults && batchResults.length !== uncached.length) {
          logger.warn(`DDBMapMetaData.findMatchesForMaps: proxy returned ${batchResults.length} results for ${uncached.length} requests; ignoring batch`);
        }
        for (const u of uncached) {
          cache.matches.set(u.key, null);
          misses += 1;
        }
      } else {
        for (let i = 0; i < uncached.length; i++) {
          const u = uncached[i];
          const result = batchResults[i] ?? null;
          if (result) cache.results.set(u.key, result);
          const first = result?.matches?.[0] ?? null;
          cache.matches.set(u.key, first);
          if (first) hits += 1;
          else misses += 1;
        }
      }
    }

    logger.info(`DDBMapMetaData.findMatchesForMaps: complete. ${hits} matched, ${misses} unmatched, ${cachedHits} previously cached.`);
    return cache.matches;
  }

  // Returns the lightweight match info (no scene JSON) that the browser
  // badge uses. Populated by findMatchesForMaps during source load.
  static getCachedMatch(map: IDDBMap): IDDBMetaMatchInfo | null {
    const key = map.id ?? map.imageKey;
    if (!key) return null;
    return _cache().matches.get(key) ?? null;
  }

  // -------- apply --------

  // Sanitise a Foundry document object (wall, light, token) for createEmbeddedDocuments.
  // Drops fields the importer must not carry over: _id (Foundry assigns fresh), document keys
  // that would carry stale module-author data.
  private static _stripDocId<T extends Record<string, any>>(doc: T): T {
    const copy = { ...doc };
    delete (copy as any)._id;
    return copy;
  }

  // Run the same scene-info cleansing AdventureMunch applies to adventure-zip
  // scenes: v13->v14 migration, drawing shape/levels fixes, perfect-vision
  // flag normalisation, stairways flag reshape, wall doorSound default. The
  // meta-data proxy payload skips _loadDocumentAssets so we mirror its
  // cleansing here before merge / createEmbeddedDocuments.
  //
  // Public so the native adventure importer can apply the same cleansing to
  // its own scene docs before create (NativeSceneBuilder).
  static cleanseSceneInfo(info: IDDBMetaScene): IDDBMetaScene {
    if (!info || typeof info !== "object") return info;

    DDBMapMetaData._normaliseLegacyGrid(info as any);

    if (parseInt(game.version) >= 14) {
      AdventureMunch._migrateSceneDataToV14(info);
    }

    if (info.flags?.["perfect-vision"] && Array.isArray(info.flags["perfect-vision"])) {
      info.flags["perfect-vision"] = {};
    }

    if (Array.isArray(info.flags?.stairways)
      && foundry.utils.isNewerVersion((game.modules.get("stairways")?.version ?? "0.10.7"), "0.10.6")) {
      info.flags!.stairways = {
        data: foundry.utils.duplicate(info.flags!.stairways ?? []),
      };
    }

    if (Array.isArray(info.walls)) {
      for (const wall of info.walls) {
        if (wall.door !== 0 && !wall.doorSound && wall.doorSound !== "") {
          wall.doorSound = "woodBasic";
        }
      }
    }

    const drawings = info.drawings;
    if (Array.isArray(drawings)) {
      info.drawings = drawings.map((d: any) => AdventureMunch._drawingFixes(d));
    }

    return info;
  }

  // The ddb-meta-data scene_info JSONs are authored in V10/V11 shape:
  //   - `grid` is a NUMBER (the grid pixel size, not an object)
  //   - `gridType`, `gridDistance`, `gridUnits`, `gridColor`, `gridAlpha` are
  //     separate top-level scalars
  // V12+ collapses these into a `grid: { type, size, distance, units, color,
  // alpha }` object. `_migrateSceneDataToV14` migrates V12→V14 but doesn't
  // know about the V10/V11 split-grid shape, so we normalise here first.
  // Subsequent migration + buildSceneUpdate then see a proper grid object.
  private static _normaliseLegacyGrid(info: any): void {
    if (!info || typeof info !== "object") return;
    const hasLegacy = typeof info.grid === "number"
      || info.gridType !== undefined
      || info.gridDistance !== undefined
      || info.gridUnits !== undefined
      || info.gridColor !== undefined
      || info.gridAlpha !== undefined;
    if (!hasLegacy) return;

    const gridObj = (info.grid && typeof info.grid === "object") ? info.grid : {};
    const sizeFromNum = typeof info.grid === "number" ? info.grid : null;
    info.grid = {
      type: Number.isFinite(info.gridType) ? info.gridType
        : (Number.isFinite(gridObj.type) ? gridObj.type : 1),
      size: Math.max(1, Math.round(
        Number.isFinite(sizeFromNum) ? sizeFromNum
          : (Number.isFinite(gridObj.size) ? gridObj.size : 100),
      )),
      distance: Number.isFinite(info.gridDistance) && info.gridDistance > 0 ? info.gridDistance
        : (Number.isFinite(gridObj.distance) && gridObj.distance > 0 ? gridObj.distance : 5),
      units: info.gridUnits || gridObj.units || "ft",
      color: info.gridColor || gridObj.color || "#000000",
      alpha: Number.isFinite(info.gridAlpha) ? info.gridAlpha
        : (Number.isFinite(gridObj.alpha) ? gridObj.alpha : 0.2),
    };
    delete info.gridType;
    delete info.gridDistance;
    delete info.gridUnits;
    delete info.gridColor;
    delete info.gridAlpha;
  }

  private static _normaliseLight(light: any): any {
    const copy = this._stripDocId(light);
    // animation may be null in scene-info JSONs but Foundry V13 expects an object.
    if (copy.animation === null || copy.animation === undefined) {
      copy.animation = { type: null };
    }
    // Darkness threshold consistency.
    const darkness = copy?.config?.darkness;
    if (darkness && typeof darkness === "object"
      && typeof darkness.min === "number" && typeof darkness.max === "number"
      && darkness.min > darkness.max) {
      copy.config.darkness = { ...darkness, max: darkness.min };
    }
    return copy;
  }

  // Get-or-create the world-level placeholder JournalEntry that meta-data
  // notes point at. Foundry's NoteDocument requires an entryId, but the
  // meta-data flow does not import journals; instead, every meta-data note
  // shares one placeholder entry and the activateNote hook intercepts the
  // click to open the DDB page popup. Memoised on CONFIG.DDBI.META for the
  // session so repeated calls don't re-scan game.journal.
  private static async _getOrCreateMetaNotesJournal(): Promise<any | null> {
    const cached = CONFIG.DDBI.META?.placeholderJournalId;
    if (cached) {
      const existing = game.journal?.get?.(cached);
      if (existing) return existing;
    }
    const byFlag = game.journal?.contents?.find?.((j: JournalEntry) =>
      foundry.utils.getProperty(j, "flags.ddbimporter.metaDataNotesPlaceholder") === true,
    );
    if (byFlag) {
      if (CONFIG.DDBI.META) CONFIG.DDBI.META.placeholderJournalId = byFlag.id;
      return byFlag;
    }
    try {
      const journalData: IPlaceholderJournalData = {
        name: META_NOTES_JOURNAL_NAME,
        flags: { ddbimporter: { metaDataNotesPlaceholder: true } },
        pages: [{
          name: META_NOTES_JOURNAL_NAME,
          type: "text",
          text: {
            content: "Placeholder journal for D&D Beyond meta-data map notes. Clicking a meta-data note on a scene opens the original D&D Beyond page in a popup; this journal exists only so Foundry's note documents have a valid entryId.",
            format: 1,
          },
        }],
      };
      const created = await JournalEntry.create(journalData as unknown as JournalEntry.CreateData, { renderSheet: false });
      if (created?.id && CONFIG.DDBI.META) CONFIG.DDBI.META.placeholderJournalId = created.id;
      return created ?? null;
    } catch (error) {
      logger.warn(`DDBMapMetaData: failed to create placeholder journal: ${(error as Error).message ?? error}`);
      return null;
    }
  }

  // Adventure-shaped stub for Iconizer.generateIcon. The Iconizer helper
  // generates an SVG and uploads it via `adventure.importRawFile(path, content,
  // mime, misc)`. The meta-data flow has no AdventureMunch instance, so this
  // shim mirrors AdventureMunch.importRawFile (lines 161-185) against a fixed
  // adventure name so every meta-data icon lands under one shared folder
  // (`<base>/ddb-meta-data/assets/icons/`) regardless of which map triggered
  // the import.
  private static _adventureStub() {
    return {
      name: META_NOTES_ADVENTURE_NAME,
      adventure: { name: META_NOTES_ADVENTURE_NAME },
      getImportFilePaths(path: string, misc: boolean): any {
        return AdventureMunchHelpers.getImportFilePaths({
          adventureName: META_NOTES_ADVENTURE_NAME,
          path,
          misc,
        });
      },
      async importRawFile(path: string, content: string, mimeType: string, misc: boolean): Promise<string> {
        try {
          if (path[0] === "*") return path.replace(/\*/g, "");
          if (path.startsWith("icons/") || path.startsWith("systems/dnd5e/icons/") || path.startsWith("ddb://")) {
            return path;
          }
          const paths: any = this.getImportFilePaths(path, misc);
          if (paths.fullUploadPath && !CONFIG.DDBI.KNOWN.CHECKED_DIRS.has(paths.fullUploadPath)) {
            await FileHelper.verifyPath(paths.parsedBaseUploadPath, `${paths.uploadPath}`);
            await FileHelper.generateCurrentFiles(paths.fullUploadPath);
            CONFIG.DDBI.KNOWN.CHECKED_DIRS.add(paths.fullUploadPath);
          }
          if (!CONFIG.DDBI.KNOWN.FILES.has(paths.pathKey)) {
            const fileData = new File([content], paths.filename, { type: mimeType });
            const response: FilePicker.UploadReturn = await FileHelper.uploadToPath(paths.fullUploadPath, fileData);
            if (!response || !response.path) {
              logger.error(`DDBMapMetaData: upload failed for ${path}: no response or path returned`, { response });
              return path;
            }
            const targetPath = response?.path;
            if (!targetPath) {
              logger.error(`DDBMapMetaData: upload failed for ${path}: no target path returned`, { response });
              return path;
            }
            CONFIG.DDBI.KNOWN.FILES.add(paths.pathKey);
            CONFIG.DDBI.KNOWN.LOOKUPS.set(`${paths.pathKey}`, targetPath);
          }
          return `${CONFIG.DDBI.KNOWN.LOOKUPS.get(paths.pathKey)}`;
        } catch (error) {
          logger.warn(`DDBMapMetaData: meta-note icon upload failed for ${path}: ${(error as Error).message ?? error}`);
          return path;
        }
      },
    };
  }

  // Build the canonical D&D Beyond URL for a meta-data note.
  //   slug:     "chapter-1-death-at-sunset#DeathatSunsetsLair" - chapter path + (irrelevant) anchor
  //   slugLink: "L1GuardedTunnel"                              - the anchor we want
  // Strip the existing anchor off slug and append `#${slugLink}` so the URL
  // lands on the note's specific anchor instead of whatever the chapter
  // page slug originally pointed at. Book-level path comes from
  // CONFIG.DDB.sources[].sourceURL (e.g. "sources/dnd/cos"); falls back to
  // "sources/dnd/<bookCode>" when sourceURL is missing.
  private static _buildMetaNoteUrl(
    bookCode: string | null,
    slug: string | null | undefined,
    slugLink: string | null | undefined,
  ): string | null {
    if (!slug) return null;
    let sourcePath: string | null = null;
    if (bookCode) {
      const source = CONFIG.DDB?.sources?.find?.((s) =>
        typeof s?.name === "string" && s.name.toLowerCase() === bookCode.toLowerCase(),
      );
      if (source?.sourceURL) sourcePath = String(source.sourceURL);
      if (!sourcePath) sourcePath = `sources/dnd/${bookCode.toLowerCase()}`;
    }
    if (!sourcePath) return null;
    const chapterSlug = slug.split("#")[0];
    const anchor = slugLink ? `#${slugLink}` : "";
    return `https://www.dndbeyond.com/${sourcePath}/${chapterSlug}${anchor}`;
  }

  // Phase F: apply notes from the meta-data scene-info JSON. Notes live at
  // `info.flags.ddb.notes` in DDB's third-party format: each carries a `label`,
  // `flags.ddb`, and a `positions[]` array of (x, y) pairs. We expand each
  // meta-note to N Foundry NoteDocs (one per position), re-point them at a
  // shared placeholder journal so they validate, generate an Iconizer icon,
  // and stamp the DDB URL on flags.ddbimporter.metaDataNote so the
  // activateNote hook can open DDBMetaNoteApp instead of the placeholder
  // journal sheet.
  private static async _applyMetaNotes(scene: Scene, metaNotes: any[], bookCode: string | null): Promise<number> {
    if (!Array.isArray(metaNotes) || !metaNotes.length) return 0;
    const placeholder = await DDBMapMetaData._getOrCreateMetaNotesJournal();
    if (!placeholder?.id) {
      logger.warn(`DDBMapMetaData: no placeholder journal available; skipping ${metaNotes.length} meta note(s) on "${scene.name}"`);
      return 0;
    }

    const noteData: any[] = [];
    for (const meta of metaNotes) {
      const ddbFlags = meta.flags?.ddb ?? {};
      const label = meta.label ?? ddbFlags.labelName ?? ddbFlags.linkName ?? "?";
      const slug = ddbFlags.slug ?? null;
      const slugLink = ddbFlags.slugLink ?? null;
      const url = DDBMapMetaData._buildMetaNoteUrl(bookCode, slug, slugLink) ?? ddbFlags.originalLink ?? null;
      let icon = "icons/svg/book.svg";
      try {
        icon = await Iconizer.generateIcon(DDBMapMetaData._adventureStub(), String(label));
      } catch (error) {
        logger.warn(`DDBMapMetaData: icon generation failed for note "${label}": ${(error as Error).message ?? error}`);
      }
      const baseFlags = foundry.utils.mergeObject({ ddb: ddbFlags }, {
        "ddbimporter": {
          metaDataNote: {
            url,
            bookCode,
            slug,
            slugLink,
            ddbId: ddbFlags.ddbId ?? null,
            parentId: ddbFlags.parentId ?? null,
            cobaltId: ddbFlags.cobaltId ?? null,
            linkName: ddbFlags.linkName ?? null,
            contentChunkId: ddbFlags.contentChunkId ?? null,
            source: "meta-data",
          },
        },
      }, { inplace: false });

      const positions = Array.isArray(meta.positions) ? meta.positions : [];
      for (const position of positions) {
        if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y)) continue;
        // V14 NoteDocument moved `icon` -> `texture.src` and `iconTint` ->
        // `texture.tint`. Setting `icon` directly is silently dropped by the
        // schema, which is why the Iconizer-generated SVGs weren't appearing.
        noteData.push({
          entryId: placeholder.id,
          x: position.x,
          y: position.y,
          texture: {
            src: icon,
            tint: typeof meta.iconTint === "string" && meta.iconTint ? meta.iconTint : null,
          },
          iconSize: Number.isFinite(meta.iconSize) ? meta.iconSize : 40,
          text: typeof label === "string" ? label : String(label),
          fontFamily: typeof meta.fontFamily === "string" ? meta.fontFamily : "Signika",
          fontSize: Number.isFinite(meta.fontSize) ? meta.fontSize : 48,
          textAnchor: Number.isFinite(meta.textAnchor) ? meta.textAnchor : 1,
          textColor: typeof meta.textColor === "string" && meta.textColor ? meta.textColor : "#ffffff",
          levels: position.levels ?? [DEFAULT_LEVEL_ID],
          flags: foundry.utils.deepClone(baseFlags),
        });
      }
    }

    if (!noteData.length) return 0;
    try {
      const created = await scene.createEmbeddedDocuments("Note", noteData);
      return Array.isArray(created) ? created.length : 0;
    } catch (error) {
      logger.warn(`DDBMapMetaData: note placement failed for "${scene.name}": ${(error as Error).message ?? error}`);
      return 0;
    }
  }

  // Stamp result + match onto the scene's ddbimporter flags. Soft-fails on update error.
  private static async _stampFlags(scene: Scene, ddbimporterFlags: IDDBImporterSceneFlags): Promise<void> {
    try {
      await scene.update({ flags: { ddbimporter: ddbimporterFlags } } as any);
      // Flag-only updates don't match SceneDirectory's renderUpdateKeys, so
      // force a render for the debug meta-data badge to appear immediately.
      ui.scenes?.render();
    } catch (error) {
      logger.warn(`DDBMapMetaData: failed to stamp scene flags: ${(error as Error).message ?? error}`);
    }
  }

  // Fields on the scene-info JSON that we never copy onto the existing scene.
  // Embedded collections are applied separately via createEmbeddedDocuments
  // or, in the case of `tiles`, deliberately NOT applied: Quickplay places
  // stickers as Tile docs (flags.ddbimporter.quickplayStickerId) and the
  // meta-data layer must leave them untouched. `regions` is similarly
  // excluded because meta-data scene dumps may carry empty/legacy region
  // arrays we don't want to inherit.
  // background.src is owned by our locally-uploaded image; _id / folder / sort
  // identify our scene and must not be overwritten. `name`/`navName` ARE applied
  // from the meta-data (highest-priority name source) - see buildSceneUpdate.
  private static readonly _MERGE_EXCLUDE_KEYS = new Set<string>([
    "_id",
    "folder",
    "sort",
    "ownership",
    "permission",
    "thumb",
    "img",
    "walls",
    "lights",
    "tokens",
    "drawings",
    "notes",
    "sounds",
    "templates",
    "tiles",    // preserve Quickplay sticker tiles
    "regions",
  ]);

  private static _countQuickplayTiles(scene: Scene): number {
    const tiles = scene?.tiles?.contents ?? scene?.tiles ?? [];
    let count = 0;
    for (const tile of tiles) {
      if (foundry.utils.getProperty(tile, "flags.ddbimporter.quickplayStickerId")) count += 1;
    }
    return count;
  }

  // V14-safe read of the scene background image path. Scene#background was
  // deprecated in V14 in favour of Level#background; reading scene.background
  // triggers a compatibility warning on every access.
  private static _readLevelBackgroundSrc(scene: Scene): string | null {
    const levels = scene?.levels?.contents ?? scene?.levels ?? [];
    const first = levels[0];
    return first?.background?.src ?? null;
  }

  // Snapshot the full data of every Quickplay-flagged Tile on the scene
  // (keyed by quickplayStickerId) so we can detect and restore any that
  // disappear during the meta-data merge. Tiles are excluded from the merge
  // payload, but defensive restoration covers any edge case where Foundry
  // touches them anyway (e.g. width/height changes triggering revalidation).
  private static _snapshotQuickplayTiles(scene: Scene): Map<string, any> {
    const snapshot = new Map<string, any>();
    const tiles = scene?.tiles?.contents ?? scene?.tiles ?? [];
    for (const tile of tiles) {
      const id = foundry.utils.getProperty(tile, "flags.ddbimporter.quickplayStickerId");
      if (!id) continue;
      try {
        snapshot.set(String(id), tile.toObject ? tile.toObject() : foundry.utils.deepClone(tile));
      } catch (error) {
        logger.warn(`DDBMapMetaData: failed to snapshot Quickplay tile ${id}: ${(error as Error).message ?? error}`);
      }
    }
    return snapshot;
  }

  // Restore any Quickplay tiles missing from the scene after meta apply.
  // Snapshot keys are quickplayStickerId. Strip _id so Foundry assigns a
  // fresh one - the original may collide if Foundry's collection retained
  // a tombstone of the removed doc.
  private static async _restoreMissingQuickplayTiles(scene: Scene, snapshot: Map<string, any>): Promise<number> {
    if (!snapshot.size) return 0;
    const presentIds = new Set<string>();
    const tiles = scene?.tiles?.contents ?? scene?.tiles ?? [];
    for (const tile of tiles) {
      const id = foundry.utils.getProperty(tile, "flags.ddbimporter.quickplayStickerId");
      if (id) presentIds.add(String(id));
    }
    const missing: any[] = [];
    for (const [id, data] of snapshot) {
      if (presentIds.has(id)) continue;
      const copy = foundry.utils.deepClone(data);
      delete copy._id;
      missing.push(copy);
    }
    if (!missing.length) return 0;
    logger.warn(`DDBMapMetaData: restoring ${missing.length} Quickplay tile${missing.length === 1 ? "" : "s"} that went missing during meta apply on "${scene.name}"`);
    try {
      const created = await scene.createEmbeddedDocuments("Tile", missing);
      return Array.isArray(created) ? created.length : 0;
    } catch (error) {
      logger.error(`DDBMapMetaData: failed to restore Quickplay tiles: ${(error as Error).message ?? error}`, error);
      return 0;
    }
  }

  // After meta-data has replaced the scene's dimensions/grid/background,
  // recompute each Quickplay tile's position and size from its stored DDB
  // raw values (flags.ddbimporter.rawPosition, rawSize, rawAspectRatio).
  // This is more accurate than a width/height-ratio rescale because it
  // re-derives canvas coords using the new scene's reference frame instead
  // of compounding the muncher's earlier transform.
  //
  // Mirrors DDBQuickplay._tileForSticker math, with the parameters now read
  // off the meta-applied scene:
  //   - imageWidth/imageHeight: from quickplayContext (DDB's source image
  //     dimensions; unchanged by meta).
  //   - sceneScale: scene.width / imageWidth - meta-data scenes are 1:1
  //     with the image so this is ~1.
  //   - gridSize: scene.grid.size (now meta-data's value).
  //   - sceneXPad/sceneYPad: scene.dimensions.sceneX/sceneY (padding offset
  //     in canvas space, recomputed by Foundry after the update).
  private static async _repositionQuickplayTiles(scene: Scene): Promise<number> {
    const ctx = foundry.utils.getProperty(scene, "flags.ddbimporter.quickplayContext") as IQuickplayContext;
    const imageWidth = Number(ctx?.stateImageWidth);
    const imageHeight = Number(ctx?.stateImageHeight);
    if (!Number.isFinite(imageWidth) || imageWidth <= 0
      || !Number.isFinite(imageHeight) || imageHeight <= 0) {
      // No Quickplay context (e.g. import without Quickplay enabled, or
      // an old scene without context flags) - nothing to reposition.
      return 0;
    }

    const sceneWidth = Number(scene.width);
    const sceneHeight = Number(scene.height);
    if (!Number.isFinite(sceneWidth) || sceneWidth <= 0
      || !Number.isFinite(sceneHeight) || sceneHeight <= 0) return 0;

    const sceneScale = sceneWidth / imageWidth;
    const gridSize = Number(scene.grid?.size) || 100;
    const dims = scene?.dimensions ?? {
      sceneX: 0,
      sceneY: 0,
    };
    const sceneXPad = Number.isFinite(dims.sceneX) ? Number(dims.sceneX) : 0;
    const sceneYPad = Number.isFinite(dims.sceneY) ? Number(dims.sceneY) : 0;
    const anchor: "center" | "topLeft" = ctx?.anchor === "topLeft" ? "topLeft" : "center";
    const POSITION_UNIT_PX = 100;

    const updates: any[] = [];
    const tiles = scene?.tiles?.contents ?? scene?.tiles ?? [];
    for (const tile of tiles) {
      const flags = (tile.flags ?? {})["ddbimporter"] ?? {};
      if (!flags.quickplayStickerId) continue;
      const rawPos = flags.rawPosition;
      const rawSize = Number(flags.rawSize);
      const rawAspect = Number(flags.rawAspectRatio);
      if (!Array.isArray(rawPos) || rawPos.length < 2) continue;
      if (!Number.isFinite(rawSize) || rawSize <= 0) continue;
      const aspect = Number.isFinite(rawAspect) && rawAspect > 0 ? rawAspect : 1;

      // Mirror DDBQuickplay._tileForSticker:
      //   width/height candidates snapped to nearest cell count
      const widthRawScene = rawSize * POSITION_UNIT_PX * sceneScale;
      const heightRawScene = widthRawScene / aspect;
      const wCells = widthRawScene / gridSize;
      const hCells = heightRawScene / gridSize;
      const wFracDist = Math.abs(wCells - Math.round(wCells));
      const hFracDist = Math.abs(hCells - Math.round(hCells));
      let widthScene: number;
      let heightScene: number;
      if (wFracDist <= hFracDist) {
        widthScene = Math.max(1, Math.round(wCells)) * gridSize;
        heightScene = widthScene / aspect;
      } else {
        heightScene = Math.max(1, Math.round(hCells)) * gridSize;
        widthScene = heightScene * aspect;
      }

      // Position: DDB centre coords (Y-flipped) -> image px -> canvas px
      const xImg = Number(rawPos[0]) * POSITION_UNIT_PX + imageWidth / 2;
      const yImg = -Number(rawPos[1]) * POSITION_UNIT_PX + imageHeight / 2;
      const xCanvas = xImg * sceneScale + sceneXPad;
      const yCanvas = yImg * sceneScale + sceneYPad;
      // V14 Tile semantics: (x, y) is the texture's anchor point in canvas
      // coords, paired with texture.anchorX/Y to pick which point of the
      // texture image lands at (x, y). Mirror DDBQuickplay's create path
      // exactly - snap the top-left to a grid corner, then write
      // x = snapped + w/2 + anchor 0.5 so the texture centres on the
      // snapped cell. Also re-bind to the default level so V14 keeps
      // rendering the tile on the same layer the muncher's scene was
      // built with.
      const centerX = anchor === "topLeft" ? xCanvas + widthScene / 2 : xCanvas;
      const centerY = anchor === "topLeft" ? yCanvas + heightScene / 2 : yCanvas;
      const topLeftXSnapped = Math.round((centerX - widthScene / 2) / gridSize) * gridSize;
      const topLeftYSnapped = Math.round((centerY - heightScene / 2) / gridSize) * gridSize;
      const tileX = topLeftXSnapped + widthScene / 2;
      const tileY = topLeftYSnapped + heightScene / 2;

      updates.push({
        _id: tile.id,
        x: tileX,
        y: tileY,
        width: Math.round(widthScene),
        height: Math.round(heightScene),
        texture: {
          anchorX: 0.5,
          anchorY: 0.5,
        },
        levels: [DEFAULT_LEVEL_ID],
      });
    }

    if (!updates.length) return 0;
    logger.info(
      `DDBMapMetaData: repositioning ${updates.length} Quickplay tile${updates.length === 1 ? "" : "s"} on "${scene.name}" using meta-data scene dims (image ${imageWidth}x${imageHeight}, scene ${sceneWidth}x${sceneHeight}, sceneScale=${sceneScale.toFixed(3)}, gridSize=${gridSize}, pad=${sceneXPad},${sceneYPad})`,
    );
    try {
      await scene.updateEmbeddedDocuments("Tile", updates);
      return updates.length;
    } catch (error) {
      logger.error(`DDBMapMetaData: failed to reposition Quickplay tiles: ${(error as Error).message ?? error}`, error);
      return 0;
    }
  }

  // Build a scene.update() payload from the meta-data scene-info JSON, merging
  // everything except identity fields, the locally-uploaded background image,
  // and embedded collections (which go through createEmbeddedDocuments).
  // Flags merge with the existing scene flags - the ddbimporter block must
  // not be clobbered.
  //
  // Public so the native adventure importer can reuse this projection when
  // applying meta-data into pre-create scene docs (NativeSceneBuilder).
  static buildSceneUpdate(scene: Scene, info: IDDBMetaScene): Record<string, any> {
    const update: Record<string, any> = {};
    const ourLevel = (scene.levels?.contents ?? scene.levels ?? [])[0];

    for (const [key, value] of Object.entries(info)) {
      if (this._MERGE_EXCLUDE_KEYS.has(key)) continue;
      if (key === "flags") continue;

      if (key === "grid" && value && typeof value === "object") {
        // Wholesale `update.grid = value` causes Foundry to default any
        // subfield the meta omitted (visibly wrong scale). Merge with sane
        // defaults, mirroring DDBMap.createScene's clamp shape.
        const cur = (scene.grid as any)?.toObject?.() ?? (scene.grid as any) ?? {};
        const v: any = value;
        update.grid = {
          type:     Number.isFinite(v.type)     ? v.type     : (Number.isFinite(cur.type) ? cur.type : 1),
          size:     Math.max(1, Math.round(Number.isFinite(v.size) ? v.size : (cur.size ?? 100))),
          distance: Number.isFinite(v.distance) && v.distance > 0
            ? v.distance : (cur.distance ?? 5),
          units:    v.units || cur.units || "ft",
          color:    v.color || cur.color || "#000000",
          alpha:    Number.isFinite(v.alpha)    ? v.alpha    : (cur.alpha ?? 0.2),
        };
        continue;
      }

      if (key === "background") {
        // V14: Scene#background is deprecated. The meta-data file still
        // carries a V12-shaped `background` block; project its non-`src`
        // scalars onto levels[0].background so V14 picks them up without
        // touching the deprecated scene-level field. The src is owned by
        // the muncher's locally-uploaded image and re-stamped separately
        // after merge.
        //
        // Post-cleanse this branch is a no-op (info.background is deleted by
        // _migrateSceneDataToV14) - kept as a safety net for un-cleansed
        // input. The post-cleanse path goes through `key === "levels"` below.
        const bg = value as Record<string, any> | null;
        if (!bg || typeof bg !== "object") continue;
        const bgUpd: Record<string, any> = {};
        for (const [bk, bv] of Object.entries(bg)) {
          if (bk === "src") continue;
          bgUpd[bk] = bv;
        }
        if (Object.keys(bgUpd).length && ourLevel?._id) {
          update.levels = [{ _id: ourLevel._id, background: bgUpd }];
        }
        continue;
      }

      if (key === "levels" && Array.isArray(value) && value.length) {
        // info.levels[0] is the V14-migrated meta level. Take meta's
        // background non-src fields + foreground + textures; preserve OUR
        // uploaded background.src + default texture anchors. Wholesale copy
        // would null out background.src (the migrated meta level has src:null).
        if (!ourLevel?._id) continue;
        const metaLevel: any = value[0] ?? {};
        const metaBg: any = metaLevel.background ?? {};
        const levelUpd: any = { _id: ourLevel._id };
        const bgUpd: any = {};
        for (const [bk, bv] of Object.entries(metaBg)) {
          if (bk === "src" || bv == null) continue;
          bgUpd[bk] = bv;
        }
        if (Object.keys(bgUpd).length) levelUpd.background = bgUpd;
        if (metaLevel.foreground !== undefined) levelUpd.foreground = metaLevel.foreground;
        if (metaLevel.textures && typeof metaLevel.textures === "object") {
          levelUpd.textures = metaLevel.textures;
        }
        if (Object.keys(levelUpd).length > 1) update.levels = [levelUpd];
        continue;
      }

      update[key] = value;
    }

    // navName follows name: if the meta supplies a name but no navName, derive a
    // tidy nav-bar label from it so the nav bar matches the applied name.
    if (typeof update.name === "string" && update.name && update.navName === undefined) {
      update.navName = _navNameFromName(update.name);
    }

    // Merge flags - preserve our ddbimporter block, take everything else from
    // the meta-data file (including module-specific flags like stairways /
    // perfect-vision / dynamic-illumination; Foundry simply stores them and
    // each module reads its own block).
    const ownFlags = foundry.utils.deepClone(scene.flags ?? {});
    const metaFlags = info.flags ?? {};
    const mergedFlags = foundry.utils.mergeObject(
      foundry.utils.deepClone(metaFlags),
      ownFlags,
      { inplace: false, overwrite: true },
    );
    update.flags = mergedFlags;

    // V14 keeps shiftX/shiftY at the root for image-vs-grid alignment.
    // Mirror the meta-data background offsets so they don't fight each other.
    // (Post-cleanse this is redundant - _migrateSceneDataToV14 already moves
    // background.offsetX/Y to root shiftX/Y, copied via update[key] above.)
    if (info.background && typeof info.background === "object") {
      if (Number.isFinite(info.background.offsetX)) update.shiftX = info.background.offsetX;
      if (Number.isFinite(info.background.offsetY)) update.shiftY = info.background.offsetY;
    }

    // Meta dims govern the scene. Every placeable (walls/lights/drawings/
    // notes/tokens/tiles) in the meta-data JSON is authored against the meta
    // `width × height` canvas; the scene must adopt those dims so coords
    // align. The uploaded background image stretches via the level's
    // `textures.fit: "fill"` set in NativeSceneBuilder.
    return update;
  }

  // Apply a single match (scene-info JSON) to a target Foundry scene. Returns
  // a result row that gets stamped onto scene.flags.ddbimporter.
  private static async _applyMatchToScene(
    scene: Scene,
    match: IDDBMetaMatch,
    options: IDDBMetaApplyOptions,
  ): Promise<IDDBMetaApplyResult> {
    const info = match.scene as IDDBMetaScene;
    const result: IDDBMetaApplyResult = {
      match,
      sceneMerged: false,
      walls: 0,
      lights: 0,
      drawings: 0,
      notes: 0,
      tokens: { created: 0, missing: 0, imported: 0, failed: 0 },
      quickplayTokensRemoved: 0,
      quickplayTilesPreserved: 0,
    };

    const notify = (msg: string) => {
      try {
        options.notifier?.(msg);
      } catch (_e) { /* ignore */ }
    };

    // Snapshot Quickplay tile docs so we can restore any that disappear
    // during the meta apply. Tiles SHOULDN'T be touched (excluded from the
    // merge payload, not in any delete path) but defensive restoration covers
    // any Foundry-side revalidation that wipes them.
    const quickplayTileSnapshot = DDBMapMetaData._snapshotQuickplayTiles(scene);
    if (quickplayTileSnapshot.size) {
      logger.info(`DDBMapMetaData: scene "${scene.name}" carries ${quickplayTileSnapshot.size} Quickplay sticker tile${quickplayTileSnapshot.size === 1 ? "" : "s"} - snapshotted for preservation`);
    }


    // Capture the muncher-set background image path before the merge. In
    // V14 the canonical location for the scene background image is
    // `levels[0].background.src` - Scene#background is deprecated and
    // raises a compatibility warning every time it's read, so we go
    // directly to the level. Meta-data scenes don't carry a `src` field
    // on either layer, so we re-stamp this onto the level after the merge
    // to defend against any deep-merge edge case clearing it.
    const munchedLevelBgSrc = DDBMapMetaData._readLevelBackgroundSrc(scene);

    // Phase A: merge the scene-info JSON onto the existing scene.
    try {
      const update = DDBMapMetaData.buildSceneUpdate(scene, info);
      if (Object.keys(update).length) {
        notify(`Merging meta-data scene fields into "${scene.name}"...`);
        await scene.update(update);
        result.sceneMerged = true;
      }
    } catch (error) {
      logger.warn(`DDBMapMetaData: scene merge failed for "${scene.name}": ${(error as Error).message ?? error}`);
    }

    // Re-stamp the level-level background image path so the texture
    // survives the merge regardless of how V14 deep-merges the partial
    // background block from meta-data.
    try {
      const restamp: Record<string, any> = {};
      const currentLevelBgSrc = DDBMapMetaData._readLevelBackgroundSrc(scene);
      if (munchedLevelBgSrc && currentLevelBgSrc !== munchedLevelBgSrc) {
        const firstLevel = (scene.levels?.contents ?? scene.levels ?? [])[0];
        if (firstLevel?._id) {
          restamp["levels"] = [{ _id: firstLevel._id, background: { src: munchedLevelBgSrc } }];
        }
      }
      if (Object.keys(restamp).length) {
        logger.info(`DDBMapMetaData: re-stamping background image path(s) on "${scene.name}" after meta merge`, restamp);
        await scene.update(restamp);
      }
    } catch (error) {
      logger.warn(`DDBMapMetaData: failed to re-stamp background src on "${scene.name}": ${(error as Error).message ?? error}`);
    }

    // Phase B: walls.
    if (Array.isArray(info.walls) && info.walls.length) {
      try {
        notify(`Placing ${info.walls.length} walls from meta-data...`);
        const wallData = info.walls.map((w) => this._stripDocId(w));
        const created = await scene.createEmbeddedDocuments("Wall", wallData);
        result.walls = Array.isArray(created) ? created.length : 0;
      } catch (error) {
        logger.warn(`DDBMapMetaData: wall placement failed for "${scene.name}": ${(error as Error).message ?? error}`);
      }
    }

    // Phase C: lights.
    if (Array.isArray(info.lights) && info.lights.length) {
      try {
        notify(`Placing ${info.lights.length} lights from meta-data...`);
        const lightData = info.lights.map((l) => this._normaliseLight(l));
        const created = await scene.createEmbeddedDocuments("AmbientLight", lightData);
        result.lights = Array.isArray(created) ? created.length : 0;
      } catch (error) {
        logger.warn(`DDBMapMetaData: light placement failed for "${scene.name}": ${(error as Error).message ?? error}`);
      }
    }

    // Phase D: drawings.
    const drawings = info.drawings;
    if (Array.isArray(drawings) && drawings.length) {
      try {
        notify(`Placing ${drawings.length} drawings from meta-data...`);
        const drawingData = drawings.map((d: any) => this._stripDocId(d));
        const created = await scene.createEmbeddedDocuments("Drawing", drawingData);
        result.drawings = Array.isArray(created) ? created.length : 0;
      } catch (error) {
        logger.warn(`DDBMapMetaData: drawing placement failed for "${scene.name}": ${(error as Error).message ?? error}`);
      }
    }

    // Phase E: tokens (conditional - meta-wins conflict deletes Quickplay tokens first).
    const metaTokens = info.flags?.ddb?.tokens;
    if (options.applyTokens && Array.isArray(metaTokens) && metaTokens.length) {
      try {
        const tokenResult = await this._applyMetaTokens(scene, metaTokens, options);
        result.quickplayTokensRemoved = tokenResult.quickplayTokensRemoved ?? 0;
        result.tokens = {
          created: tokenResult.created,
          missing: tokenResult.missing,
          imported: tokenResult.imported,
          failed: tokenResult.failed,
        };
      } catch (error) {
        logger.warn(`DDBMapMetaData: token placement failed for "${scene.name}": ${(error as Error).message ?? error}`);
      }
    }

    // Phase F: notes. Unlike walls/lights/drawings, the meta-data flow does
    // not import journals, so each note is re-pointed at a shared placeholder
    // journal and carries its DDB URL on flags so the activateNote hook can
    // open the DDB page popup instead of the placeholder sheet.
    const metaNotes = info.flags?.ddb?.notes;
    const bookCode = info.flags?.ddb?.bookCode ?? match.bookCode ?? null;
    if (Array.isArray(metaNotes) && metaNotes.length) {
      try {
        notify(`Placing ${metaNotes.length} note${metaNotes.length === 1 ? "" : "s"} from meta-data...`);
        result.notes = await DDBMapMetaData._applyMetaNotes(scene, metaNotes, bookCode);
      } catch (error) {
        logger.warn(`DDBMapMetaData: note placement failed for "${scene.name}": ${(error as Error).message ?? error}`);
      }
    }

    // Restore any Quickplay tiles missing after meta apply. Logs a warning
    // when restoration kicks in so the underlying bug is visible.
    const restored = await DDBMapMetaData._restoreMissingQuickplayTiles(scene, quickplayTileSnapshot);
    if (restored) {
      logger.info(`DDBMapMetaData: restored ${restored} Quickplay tile${restored === 1 ? "" : "s"} on "${scene.name}"`);
    }

    // Reposition Quickplay tiles using meta-data's scene dimensions plus the
    // tiles' stored DDB raw values. The muncher's earlier coords assumed a
    // scaled scene; meta-data scenes are usually 1:1 with the image so we
    // need to re-derive canvas positions from scratch.
    await DDBMapMetaData._repositionQuickplayTiles(scene);

    result.quickplayTilesPreserved = DDBMapMetaData._countQuickplayTiles(scene);

    await this._stampFlags(scene, {
      metaDataApplied: true,
      metaDataMatch: match,
      metaDataResult: result,
      metaDataError: null,
    });

    return result;
  }

  // Foundry's Scene.clone fork. Returns a freshly-persisted scene that copies
  // the source's image upload, dimensions, folder, and any embedded documents
  // already on it (Quickplay tokens, etc.). We rename it via the optional
  // `name` argument so multi-floor maps surface distinct entries in the Scene
  // directory.
  private static async _cloneScene(source: any, name: string | null): Promise<any | null> {
    try {
      const overrides: Record<string, any> = {};
      if (name) overrides.name = name;
      const cloned = await source.clone(overrides, { save: true });
      return cloned ?? null;
    } catch (error) {
      logger.error(`DDBMapMetaData: scene clone failed for "${source?.name}": ${(error as Error).message ?? error}`, error);
      return null;
    }
  }

  // Top-level entry point. Two proxy calls:
  //   1. /match  - lightweight, cached - "does this map have meta-data?"
  //   2. /scenes - heavy, uncached     - fetch the full scene-info JSONs for
  //                                       the matches we actually need
  // When the match step returns 2+ matches (operator-configured multi-floor
  // hint), additional Foundry scenes are cloned from the original and each
  // one receives its assigned scene-info payload. Returns the array of
  // per-scene apply results, or an empty array on no match / unrecoverable
  // proxy failure.
  static async enrich(
    scene: Scene,
    map: IDDBMap,
    options: IDDBMetaApplyOptions,
  ): Promise<IDDBMetaApplyResult[]> {
    if (!scene) return [];

    // Step 1: resolve match info via the cached match endpoint.
    const matchResult = await this.fetchMatchInfo(map);
    const matchInfos = matchResult?.matches ?? [];
    logger.info(
      `DDBMapMetaData.enrich: "${scene.name}" reason=${matchResult?.reason ?? "none"} matchedBy=${matchInfos[0]?.matchedBy ?? "-"} matches=${matchInfos.length}`,
      _proxyRequestForMap(map),
    );
    if (!matchInfos.length) {
      await this._stampFlags(scene, {
        metaDataApplied: false,
        metaDataMatch: null,
        metaDataReason: matchResult?.reason ?? "proxy-unavailable",
      });
      return [];
    }

    // Step 2: fetch the scene JSONs for those matches. NOT cached at the
    // proxy API level; called only at import time.
    logger.info(`DDBMapMetaData.enrich: fetching ${matchInfos.length} scene-info payload${matchInfos.length === 1 ? "" : "s"} for "${map.name}"`);
    const refs = matchInfos.map((m) => ({ bookCode: m.bookCode, filepath: m.filepath }));
    let fetched: {
      bookCode: string;
      filepath: string;
      scene: any | null;
      error?: string;
    }[] | null = null;
    try {
      fetched = await DDBMaps.fetchMetaSceneInfos(refs);
    } catch (error) {
      logger.warn(`DDBMapMetaData.enrich: scene-info fetch failed for "${map.name}": ${(error as Error).message ?? error}`);
    }
    if (!Array.isArray(fetched) || fetched.length !== matchInfos.length) {
      await this._stampFlags(scene, {
        metaDataApplied: false,
        metaDataMatch: matchInfos[0] ?? null,
        metaDataError: "scene-info-fetch-failed",
      });
      return [];
    }

    // Step 3: pair match info with its scene JSON. Drop any that failed to
    // load - those positions don't get a Foundry scene at all.
    const fullMatches: IDDBMetaMatch[] = [];
    for (let i = 0; i < matchInfos.length; i++) {
      const payload = fetched[i];
      if (!payload?.scene) {
        logger.warn(`DDBMapMetaData.enrich: skipping match ${matchInfos[i].filepath} (${payload?.error ?? "no scene"})`);
        continue;
      }
      fullMatches.push({ ...matchInfos[i], scene: DDBMapMetaData.cleanseSceneInfo(payload.scene) });
    }
    if (!fullMatches.length) {
      await this._stampFlags(scene, {
        metaDataApplied: false,
        metaDataMatch: matchInfos[0] ?? null,
        metaDataError: "all-scene-fetches-failed",
      });
      return [];
    }

    // Missing scenes are already pre-expanded: one Foundry scene per season/floor
    // variant. Many variants share a single image file (e.g. c4003.jpg backs Alley
    // Summer/Autumn/Winter), so a filename-based proxy match can return ALL sibling
    // scene-info files for one scene. The multi-floor clone path below (meant for
    // one journal map image -> N floors) would then duplicate the scene. Instead,
    // apply the single scene-info that belongs to this scene (keyed on
    // contentChunkId, else name) with no clone. Its name IS applied via the merge
    // (metadata is the top-priority name source).
    const isMissing = (scene as any)?.flags?.ddb?.source === "missing";
    if (isMissing) {
      const wantCcId = (scene as any)?.flags?.ddb?.contentChunkId;
      const byChunk = fullMatches.find((m) => m.scene?.flags?.ddb?.contentChunkId === wantCcId);
      // Name fallback: compare against the authoritative per-variant `sceneName`
      // from the /match payload (and the scene-info `name`, often absent), both
      // normalised + suffix-stripped, so a metadata file without a contentChunkId
      // still resolves to the right variant.
      const wantName = _normaliseName(_stripVersionSuffix(scene.name));
      const matchName = (m: IDDBMetaMatch): string =>
        _normaliseName(_stripVersionSuffix(m.sceneName ?? m.scene?.name));
      const byName = wantName ? fullMatches.find((m) => matchName(m) === wantName) : undefined;
      const chosen = byChunk ?? byName ?? fullMatches[0];
      const how = byChunk ? "contentChunkId" : (byName ? "name-fallback" : "first-match-fallback");
      logger.info(
        `DDBMapMetaData.enrich: missing scene "${scene.name}" (${wantCcId}) - applying single match ${chosen.filepath} via ${how}; clone/rename skipped`,
        { wantName, candidates: fullMatches.map((m) => ({ name: m.sceneName ?? m.scene?.name, ccId: m.scene?.flags?.ddb?.contentChunkId, filepath: m.filepath })) },
      );
      return [await this._applyMatchToScene(scene, chosen, options)];
    }

    // Step 4: clone extra Foundry scenes for matches beyond the first. Done
    // up front, before mutations, so every clone starts from the same state.
    const scenes: any[] = [scene];
    for (let i = 1; i < fullMatches.length; i++) {
      const cloneName = fullMatches[i].scene?.name ?? `${scene.name} (${i + 1})`;
      const dup = await this._cloneScene(scene, cloneName);
      if (dup) scenes.push(dup);
      else logger.warn(`DDBMapMetaData.enrich: failed to clone scene for extra match ${i + 1} (${fullMatches[i].filepath}); skipping that floor`);
    }
    // Multi-match: rename the original to its meta name so floors read consistently.
    if (fullMatches.length > 1 && fullMatches[0].scene?.name && scene.name !== fullMatches[0].scene.name) {
      try {
        await scene.update({ name: fullMatches[0].scene.name } as any);
      } catch (error) {
        logger.warn(`DDBMapMetaData.enrich: failed to rename original scene to "${fullMatches[0].scene.name}": ${(error as Error).message ?? error}`);
      }
    }

    // Step 5: apply each match to its assigned scene.
    const results: IDDBMetaApplyResult[] = [];
    for (let i = 0; i < scenes.length; i++) {
      results.push(await this._applyMatchToScene(scenes[i], fullMatches[i], options));
    }
    return results;
  }

  // Apply tokens carried by flags.ddb.tokens in the scene-info JSON. Meta-wins
  // conflict handling: any existing Quickplay tokens on the scene are deleted
  // before placement.
  private static async _applyMetaTokens(
    scene: Scene,
    metaTokens: any[],
    options: IDDBMetaApplyOptions,
  ): Promise<IDDBMetaApplyResult["tokens"] & { quickplayTokensRemoved?: number }> {
    const out = { created: 0, missing: 0, imported: 0, failed: 0, quickplayTokensRemoved: 0 };
    const notify = (msg: string) => {
      try {
        options.notifier?.(msg);
      } catch (_e) { /* ignore */ }
    };

    // 2014→2024 monster swap (native importer): map a token's legacy DDB id to its
    // 2024 replacement id; unswapped ids pass through unchanged.
    const swapId = (id: number): number =>
      (Number.isFinite(id) ? (options.monsterSwap?.get(id)?.id2024 ?? id) : id);

    // Step 1: meta-wins. Remove pre-existing Quickplay tokens so the meta layout
    // becomes the authoritative one.
    const existingQpIds: string[] = [];
    for (const tokenDoc of (scene.tokens?.contents ?? [])) {
      const qpId = foundry.utils.getProperty(tokenDoc, "flags.ddbimporter.quickplayTokenId");
      if (qpId) existingQpIds.push(tokenDoc.id);
    }
    if (existingQpIds.length) {
      try {
        await scene.deleteEmbeddedDocuments("Token", existingQpIds);
        out.quickplayTokensRemoved = existingQpIds.length;
      } catch (error) {
        logger.warn(`DDBMapMetaData: failed to clear ${existingQpIds.length} Quickplay tokens before meta apply: ${(error as Error).message ?? error}`);
      }
    }

    // Step 2: collect DDB monster ids (post 2014→2024 swap, so the 2024 actors
    // get imported and placed).
    const ddbIds = [...new Set(
      metaTokens
        .map((t) => Number(foundry.utils.getProperty(t, "flags.ddbActorFlags.id")))
        .filter((n) => Number.isFinite(n))
        .map((n) => swapId(n)),
    )] as number[];
    if (!ddbIds.length) return out;

    // Step 3: load monster index, import any missing.
    let monsterIndex: any = await AdventureMunchHelpers.getCompendiumIndex("monster");
    const presentIds = (): Set<number> => new Set<number>(
      [...monsterIndex]
        .map((m: any) => Number(foundry.utils.getProperty(m, "flags.ddbimporter.id")))
        .filter((n: number) => Number.isFinite(n)),
    );
    let present = presentIds();
    const missingIds = ddbIds.filter((id) => !present.has(id));
    if (missingIds.length && !options.noAutoImport) {
      try {
        notify(`Importing ${missingIds.length} missing monster${missingIds.length === 1 ? "" : "s"} for meta-data tokens...`);
        await AdventureMunchHelpers.loadMissingDocuments("monster", missingIds);
        monsterIndex = await AdventureMunchHelpers.getCompendiumIndex("monster");
        present = presentIds();
        out.imported = missingIds.filter((id) => present.has(id)).length;
      } catch (error) {
        logger.warn(`DDBMapMetaData: missing-monster import failed: ${(error as Error).message ?? error}`);
      }
    }
    out.missing = ddbIds.filter((id) => !present.has(id)).length;

    // Step 4: materialise world actors.
    const monsterCompendium = CompendiumHelper.getCompendiumType("monster", false) as CompendiumCollection<"Actor"> | null;
    const actorFolderId = await DDBMapMetaData._resolveActorFolderId(options.actorFolderPath ?? null);
    const actorByDdbId = new Map<number, any>();
    for (const ddbId of ddbIds) {
      const monsterEntry = monsterIndex.find(
        (m: any) => Number(foundry.utils.getProperty(m, "flags.ddbimporter.id")) === ddbId,
      );
      if (!monsterEntry) continue;
      const existing = (game.actors?.contents ?? []).find((a: any) =>
        Number(foundry.utils.getProperty(a, "flags.ddbimporter.id")) === ddbId,
      );
      if (existing) {
        actorByDdbId.set(ddbId, existing);
        continue;
      }
      try {
        const updateData: Record<string, unknown> = {};
        if (actorFolderId) updateData.folder = actorFolderId;
        const worldActor = await game.actors.importFromCompendium(
          monsterCompendium,
          monsterEntry._id,
          updateData,
          { keepId: false, keepEmbeddedIds: true },
        );
        if (worldActor) actorByDdbId.set(ddbId, worldActor);
      } catch (error) {
        logger.warn(`DDBMapMetaData: failed to import actor ${ddbId}: ${(error as Error).message ?? error}`);
      }
    }

    // Step 5: build token data per meta placement.
    const tokenData: any[] = [];
    for (const t of metaTokens) {
      const rawId = Number(foundry.utils.getProperty(t, "flags.ddbActorFlags.id"));
      // Apply the 2014→2024 swap: place the 2024 actor and use its name when the
      // token carried a hard-coded legacy name.
      const ddbEntityId = swapId(rawId);
      const swapped = Number.isFinite(rawId) ? options.monsterSwap?.get(rawId) : undefined;
      const worldActor = Number.isFinite(ddbEntityId) ? actorByDdbId.get(ddbEntityId) : null;
      if (!worldActor) {
        out.failed += 1;
        continue;
      }
      // Build a stub from the meta-data token. Drop _id / actorId / actorData so
      // Foundry assigns fresh ids and the actor data follows the world actor's
      // prototype rather than stale embedded data.
      const stub: Record<string, any> = {
        x: Number.isFinite(t.x) ? t.x : 0,
        y: Number.isFinite(t.y) ? t.y : 0,
        hidden: !!t.hidden,
        name: swapped?.name2024 ?? (typeof t.name === "string" ? t.name : worldActor.name),
        flags: foundry.utils.mergeObject({}, t.flags ?? {}, { inplace: false }),
      };
      if (Number.isFinite(t.elevation)) stub.elevation = t.elevation;
      if (Number.isFinite(t.rotation)) stub.rotation = t.rotation;
      if (Number.isFinite(t.disposition)) stub.disposition = t.disposition;
      if (Number.isFinite(t.width)) stub.width = t.width;
      if (Number.isFinite(t.height)) stub.height = t.height;
      // V14 token-level fields - _migrateSceneDataToV14 stamps these on
      // adventure-zip tokens but the meta-data payload carries tokens under
      // flags.ddb.tokens which the migration doesn't touch.
      if (parseInt(game.version) >= 14) {
        stub.level = t.level ?? DEFAULT_LEVEL_ID;
        stub.depth = Number.isFinite(t.depth) ? t.depth : 1;
      }
      // Strip any embedded actor doc id, ddbimporter source attribution.
      delete stub.actorData;
      stub.flags["ddbimporter"] = foundry.utils.mergeObject(
        stub.flags["ddbimporter"] ?? {},
        { source: "meta-data", ddbEntityId, metaTokenId: t._id ?? null },
        { inplace: false },
      );
      // Keep the actor-flag id in sync with the swapped 2024 id so re-imports and
      // linkExistingActorTokens resolve the 2024 actor.
      if (swapped) {
        stub.flags["ddbActorFlags"] = foundry.utils.mergeObject(
          stub.flags["ddbActorFlags"] ?? {},
          { id: ddbEntityId },
          { inplace: false },
        );
      }
      try {
        const doc = await worldActor.getTokenDocument(stub);
        const data = doc.toObject();
        delete (data as any)._id;
        tokenData.push(data);
      } catch (error) {
        logger.warn(`DDBMapMetaData: failed to build token "${stub.name}": ${(error as Error).message ?? error}`);
        out.failed += 1;
      }
    }

    if (!tokenData.length) return out;

    notify(`Placing ${tokenData.length} meta-data token${tokenData.length === 1 ? "" : "s"} on scene...`);
    try {
      const created = await scene.createEmbeddedDocuments("Token", tokenData);
      out.created = Array.isArray(created) ? created.length : 0;
    } catch (error) {
      logger.warn(`DDBMapMetaData: createEmbeddedDocuments(Token) failed: ${(error as Error).message ?? error}`);
      out.failed += tokenData.length;
    }
    return out;
  }

  private static async _resolveActorFolderId(path: string[] | null): Promise<string | null> {
    if (!path?.length) return null;
    let parent: any = null;
    for (const rawName of path) {
      const name = (rawName ?? "").trim();
      if (!name) continue;
      try {
        parent = await FolderHelper.getOrCreateFolder(parent, "Actor", name);
      } catch (error) {
        logger.warn(`DDBMapMetaData: failed to ensure Actor folder "${name}": ${(error as Error).message ?? error}`);
        return parent?.id ?? null;
      }
    }
    return parent?.id ?? null;
  }
}
