import { logger } from "../../lib/_module";
import { IDDBPreparedState, IDDBPreparedStickerEntity } from "../DDBMaps";
import { IDDBSticker } from "../DDBStickers";
import DDBSticker from "./DDBSticker";

const DEFAULT_LEVEL_ID = "defaultLevel0000";

export interface IDDBQuickplayApplyOptions {
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

export interface IDDBQuickplayApplyResult {
  tilesCreated: number;
  tilesFailed: number;
  stickersImported: number;
  stickersFailed: number;
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
  flags: { "ddb-importer": Record<string, unknown> };
}

// Resolve a placed sticker's catalog metadata from the cached sticker browser
// payload so we know its primarySourceId / set name. Falls back to a minimal
// shape when the sticker isn't in the user's catalog (e.g., they haven't
// loaded the sticker browser yet).
function resolveCatalogSticker(imageKey: string): IDDBSticker {
  const cache: any = (globalThis as any).CONFIG?.DDBI?.STICKERS?.payload;
  const all = cache?.stickers ?? [];
  const hit = all.find((s: IDDBSticker) => s.entitledData?.imageKey === imageKey);
  if (hit) return hit;
  // Minimal synthetic sticker - enough for DDBSticker.import() to download
  // by key and write a meta entry. setName falls back to a derived slug.
  return {
    gameElementUri: `quickplay-${imageKey}`,
    name: imageKey.split("/").pop()?.replace(/\.[a-z]+$/i, "") ?? "sticker",
    keywords: [],
    primarySourceId: -1,
    thumbnailKey: imageKey.replace("official/stickers/", "thumbnails/official/stickers/"),
    entitledData: { imageKey },
  };
}

// Re-export for clarity at call sites.
export type { IDDBPreparedState, IDDBPreparedStickerEntity };

export default class DDBQuickplay {

  // Read tokenScale from the prepared state, with a fallback to the map's
  // own tokenScale field if the state's was stripped or zero.
  private static _cellPx(state: IDDBPreparedState, mapTokenScale: number | null | undefined): number | null {
    const ts = (typeof state.tokenScale === "number" && state.tokenScale > 0)
      ? state.tokenScale
      : (typeof mapTokenScale === "number" && mapTokenScale > 0 ? mapTokenScale : null);
    if (ts === null) return null;
    const w = state.size?.width;
    if (typeof w !== "number" || w <= 0) return null;
    return w * ts;
  }

  // Apply a prepared state's stickers to an already-created Foundry scene.
  // The scene is expected to have been created by DDBMap with a known
  // sceneScale/offset (read back from `flags.ddb-importer`). Tokens and
  // overlays from the state are intentionally ignored at this stage.
  static async applyToScene(
    scene: any,
    state: IDDBPreparedState,
    mapTokenScale: number | null | undefined,
    options: IDDBQuickplayApplyOptions = {},
  ): Promise<IDDBQuickplayApplyResult> {
    const result: IDDBQuickplayApplyResult = {
      tilesCreated: 0,
      tilesFailed: 0,
      stickersImported: 0,
      stickersFailed: 0,
    };
    const stickerIds = state.stickers?.ids ?? [];
    const entities = state.stickers?.entities ?? {};
    if (!stickerIds.length) return result;

    const cellPx = DDBQuickplay._cellPx(state, mapTokenScale);
    if (cellPx === null) {
      logger.warn(
        "DDBQuickplay: cannot resolve cellPx from state.tokenScale + size.width; skipping placement",
      );
      return result;
    }

    // Read scene-scale stamped on the scene by DDBMap. Tile coordinates in
    // Foundry V13 do NOT need the background offset subtracted - the texture-
    // anchor offset only adjusts how the image renders relative to the grid;
    // tile positions are in canvas (scene-pixel) space and unaffected.
    const f = scene.flags?.["ddb-importer"] ?? {};
    const sceneScale = typeof f.gridSceneScale === "number" ? f.gridSceneScale : 1;
    const liveOffsetX = scene.background?.shiftX;
    const liveOffsetY = scene.background?.shiftY;
    const sceneOffsetX = typeof liveOffsetX === "number" ? liveOffsetX : 0;
    const sceneOffsetY = typeof liveOffsetY === "number" ? liveOffsetY : 0;
    // Foundry's actual grid size on the scene - what tiles need to align to.
    // Defaults to 100 if we somehow can't read it.
    const gridSize = (scene as any).grid?.size ?? 100;
    // Position anchor for DDB stickers - confirmed empirically as `center`
    // across multiple maps. Kept as an option in case future layouts differ.
    const anchor = options.positionAnchor ?? "center";
    const concurrency = Math.max(1, options.concurrency ?? 4);
    const notify = options.notifier ?? (() => undefined);

    // Foundry's tile coordinates live in scene-canvas space, which includes
    // padding. scene.dimensions is the precomputed canvas layout - sceneX/Y
    // is the offset of the image within the padded canvas (so a tile at
    // image-pixel (0,0) sits at canvas (sceneX, sceneY)). We add this to the
    // background-offset-shifted image position to land in the right place.
    const dims = (scene as any).dimensions ?? {};
    const sceneXPad = typeof dims.sceneX === "number" ? dims.sceneX : 0;
    const sceneYPad = typeof dims.sceneY === "number" ? dims.sceneY : 0;

    logger.info(`DDBQuickplay: resolving placement for "${scene.name}"`, {
      stickerCount: stickerIds.length,
      cellPx,
      stateTokenScale: state.tokenScale,
      mapTokenScale,
      stateImageWidth: state.size?.width,
      stateImageHeight: state.size?.height,
      sceneScale,
      sceneOffsetX,
      sceneOffsetY,
      anchor,
      sceneWidth: scene.width,
      sceneHeight: scene.height,
      scenePadding: (scene as any).padding,
      sceneDimensions: dims,
      sceneXPad,
      sceneYPad,
    });

    // Phase 1: import each unique sticker imageKey (download + upload). Group
    // by imageKey so duplicate placements share one upload pass.
    const uniqueKeys = new Set<string>();
    for (const id of stickerIds) {
      const e = entities[id];
      if (e?.imageKey) uniqueKeys.add(e.imageKey);
    }
    notify(`Importing ${uniqueKeys.size} unique sticker${uniqueKeys.size === 1 ? "" : "s"} for Quickplay layout...`);

    const localPaths = new Map<string, string>();
    const items = [...uniqueKeys].map((imageKey) => {
      const sticker = resolveCatalogSticker(imageKey);
      const setName = (() => {
        if (typeof sticker.primarySourceId === "number" && sticker.primarySourceId >= 0) {
          // Reuse the same source-name lookup the browser uses if available.
          const fn = (globalThis as any)?.CONFIG?.DDBI?._stickerSetName;
          if (typeof fn === "function") return fn(sticker.primarySourceId);
        }
        return null;
      })();
      return {
        sticker,
        options: {
          cobalt: options.cobalt ?? null,
          campaignId: options.campaignId ?? null,
          setName,
          notifier: options.notifier ?? null,
        },
      };
    });

    await DDBSticker.importBatch(items, (info) => {
      if (info.error || !info.result?.imagePath) {
        result.stickersFailed += 1;
      } else {
        result.stickersImported += 1;
        localPaths.set(info.sticker.entitledData?.imageKey ?? "", info.result.imagePath);
      }
    }, concurrency);

    // Phase 2: build Tile documents and bulk-create them on the scene.
    const tileData: ITileSourceData[] = [];
    for (const id of stickerIds) {
      const e = entities[id];
      if (!e || e.hidden && false /* keep hidden ones; user can hide on a layer */) continue;
      const localPath = localPaths.get(e.imageKey);
      if (!localPath) {
        result.tilesFailed += 1;
        continue;
      }
      const tile = DDBQuickplay._tileForSticker(
        e, localPath, cellPx, sceneScale, sceneOffsetX, sceneOffsetY,
        sceneXPad, sceneYPad, gridSize,
        state.size?.width ?? 0, state.size?.height ?? 0,
        anchor,
      );
      if (tile) tileData.push(tile);
      else result.tilesFailed += 1;
    }

    if (!tileData.length) {
      notify("No tiles to create.");
      return result;
    }

    notify(`Creating ${tileData.length} tile${tileData.length === 1 ? "" : "s"} on scene...`);
    try {
      const created = await scene.createEmbeddedDocuments("Tile", tileData);
      result.tilesCreated += Array.isArray(created) ? created.length : 0;
    } catch (error) {
      logger.error(`DDBQuickplay: createEmbeddedDocuments failed: ${(error as Error).message}`, error);
      result.tilesFailed += tileData.length;
    }

    // Stamp the scene-level placement context onto scene flags so we can
    // recover it later (e.g., from `DDBQuickplay.dumpScene`) without rerunning
    // the import. We also stamp the raw `state.tokens` array even when token
    // import is disabled - downstream tooling can pick it up later.
    try {
      const rawTokens = state.tokens?.ids?.map((id) => state.tokens!.entities[id]) ?? [];
      await scene.update({
        flags: {
          "ddb-importer": {
            quickplayContext: {
              cellPx,
              sceneScale,
              sceneOffsetX,
              sceneOffsetY,
              sceneXPad,
              sceneYPad,
              gridSize,
              anchor,
              stateImageWidth: state.size?.width ?? null,
              stateImageHeight: state.size?.height ?? null,
              stateTokenScale: state.tokenScale ?? null,
            },
            quickplayTokens: rawTokens,
          },
        },
      });
    } catch (error) {
      logger.warn(`DDBQuickplay: failed to stamp quickplayContext: ${(error as Error).message}`);
    }
    return result;
  }

  // Console helper: returns a flat array of every Quickplay-imported tile on
  // the given scene with its raw DDB values, current Foundry placement, and
  // the scene context. Designed to be copied directly out of F12 (right-click
  // -> "Copy object") and pasted into a chat or doc.
  //
  // Usage from a Foundry console:
  //   const data = CONFIG.DDBI.dumpQuickplay(canvas.scene);
  //   copy(data); // or copy(JSON.stringify(data, null, 2));
  static dumpScene(scene: any): {
    sceneName: string;
    sceneId: string;
    context: any;
    tiles: any[];
    tokens: any[];
  } {
    const ctx = scene?.flags?.["ddb-importer"]?.quickplayContext ?? null;
    const tiles = (scene?.tiles?.contents ?? scene?.tiles ?? []) as any[];
    const tilesOut = [];
    for (const t of tiles) {
      const f = t.flags?.["ddb-importer"];
      if (!f?.quickplayStickerId) continue;
      tilesOut.push({
        name: f.quickplayStickerName,
        rawPosition: f.rawPosition,
        rawSize: f.rawSize,
        rawAspectRatio: f.rawAspectRatio,
        rawRotation: f.rawRotation,
        rawZPosition: f.rawZPosition,
        current: {
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          rotation: t.rotation,
        },
        computedAtImport: f.calc ?? null,
      });
    }
    // Raw token payload stamped on the scene at import time. Available even
    // when token import is disabled (it's just data passthrough).
    const rawTokens = scene?.flags?.["ddb-importer"]?.quickplayTokens ?? [];
    return {
      sceneName: scene?.name ?? "(unnamed)",
      sceneId: scene?.id ?? "",
      context: ctx,
      tiles: tilesOut,
      tokens: rawTokens,
    };
  }

  // Empirically-derived constant: DDB stores sticker positions in units of
  // 100 image-pixels regardless of the image's actual cellPx. Confirmed
  // across two maps with very different cellPx values (126 and 143). Likely
  // reflects a normalized "5 ft = 100 px" editor grid that's independent of
  // the rendered image's resolution.
  private static readonly POSITION_UNIT_PX = 100;

  private static _tileForSticker(
    e: IDDBPreparedStickerEntity,
    localPath: string,
    cellPx: number,
    sceneScale: number,
    _sceneOffsetX: number,
    _sceneOffsetY: number,
    sceneXPad: number,
    sceneYPad: number,
    gridSize: number,
    imageWidth: number,
    imageHeight: number,
    anchor: "center" | "topLeft",
  ): ITileSourceData | null {
    if (!Array.isArray(e.position) || e.position.length < 2) return null;
    if (!(typeof e.size === "number" && e.size > 0)) return null;
    const aspect = typeof e.aspectRatio === "number" && e.aspectRatio > 0 ? e.aspectRatio : 1;

    // Both `size` and `position` use the same 100-px-per-unit constant.
    // Sizes get snapped: whichever dimension is closer to an integer cell
    // count is rounded to that, then the other dim is derived from aspect
    // (so the tile fits cleanly in N × M grid cells while preserving its
    // intended shape).
    const widthRawScene = e.size * DDBQuickplay.POSITION_UNIT_PX * sceneScale;
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

    // Position is the sticker's centre, in DDB units, from the image centre.
    // X is the same direction as image pixels; Y is flipped (DDB positive-Y
    // points up, Foundry positive-Y points down).
    const xImg = e.position[0] * DDBQuickplay.POSITION_UNIT_PX + imageWidth / 2;
    const yImg = -e.position[1] * DDBQuickplay.POSITION_UNIT_PX + imageHeight / 2;

    // Image-pixel space → scene-canvas space. NO offset subtraction: tile
    // coordinates are in canvas (post-padding) space and Foundry's texture
    // offset only adjusts grid-vs-image alignment, not tile placement.
    const xScene = xImg * sceneScale;
    const yScene = yImg * sceneScale;
    const xCanvas = xScene + sceneXPad;
    const yCanvas = yScene + sceneYPad;

    // Foundry v14: with texture.anchorX/Y = 0.5 (which we always set below),
    // the Tile document's x/y IS the tile centre. Resolve the centre in
    // canvas-space first, then snap so the tile's edges land on whole grid
    // cells. (Foundry only snaps on drag-drop; createEmbeddedDocuments
    // accepts the exact coords we provide.)
    const centerXCanvas = anchor === "topLeft" ? xCanvas + widthScene / 2 : xCanvas;
    const centerYCanvas = anchor === "topLeft" ? yCanvas + heightScene / 2 : yCanvas;
    const topLeftXSnapped = Math.round((centerXCanvas - widthScene / 2) / gridSize) * gridSize;
    const topLeftYSnapped = Math.round((centerYCanvas - heightScene / 2) / gridSize) * gridSize;
    const tileX = topLeftXSnapped + widthScene / 2;
    const tileY = topLeftYSnapped + heightScene / 2;

    return {
      texture: {
        src: localPath,
        anchorX: 0.5,
        anchorY: 0.5,
        fit: "fill",
        scaleX: 1,
        scaleY: 1,
      },
      width: widthScene,
      height: heightScene,
      x: tileX,
      y: tileY,
      rotation: typeof e.rotation === "number" ? e.rotation : 0,
      // Foundry uses an integer `sort` for z-order. zPosition is a float
      // like 0.01 in DDB's data, so we scale up to get usable integers.
      sort: Math.round((typeof e.zPosition === "number" ? e.zPosition : 0) * 1000),
      hidden: !!e.hidden,
      locked: !!e.locked,
      levels: [DEFAULT_LEVEL_ID],
      flags: {
        "ddb-importer": {
          quickplayStickerId: e.id,
          quickplayStickerName: e.name,
          imageKey: e.imageKey,
          thumbnailKey: e.thumbnailKey ?? null,
          stickerType: e.type,
          rawPosition: e.position,
          rawSize: e.size,
          rawAspectRatio: e.aspectRatio,
          rawRotation: e.rotation,
          rawZPosition: e.zPosition,
          // Trimmed diagnostic - the kept fields let us back-derive the
          // intermediate scene/canvas coords if needed (xScene = xImg *
          // sceneScale; xCanvas = xScene + sceneXPad; widthScene from
          // tileX/tileY rounding back-out, etc.). Full per-step trail lives
          // on quickplayContext at the scene level. tileX/tileY are the
          // tile centre in v14 (texture anchor 0.5/0.5); topLeftX/Y are
          // derived for readability when comparing to Foundry's rendered
          // top-left corner.
          calc: {
            cellPx,
            sceneScale,
            sceneXPad,
            sceneYPad,
            xImg,
            yImg,
            tileX,
            tileY,
            topLeftX: tileX - widthScene / 2,
            topLeftY: tileY - heightScene / 2,
          },
        },
      },
    };
  }

}
