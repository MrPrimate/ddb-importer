// Meta-data regions: the scene-info JSONs carry Region documents exported from the authoring world,
// with behaviour data that points at other documents there by UUID (teleport destinations, toggled
// behaviours, applied effects). Those UUIDs name the author's scene ids, which mean nothing in the
// importing world, so they are rewritten here: to the scene being built when the target is in the
// same file, or parked on a flag for the book-level relink pass when it is not.
//
// Also converts Perfect Vision darkness areas (drawings carrying flags.perfect-vision) into core
// adjustDarknessLevel regions, and decides which meta drawings Foundry 14 would reject.

export const META_REGION_SOURCE = "meta-data";

// Scene-embedded document UUID: Scene.<sceneId>.Region.<regionId>[.RegionBehavior.<behaviorId>].
// Other embedded types (Token, Tile...) are matched too so they can be reported, but only region
// targets can be re-pointed: meta regions keep their ids, every other placeable gets a new one.
const SCENE_UUID = /^Scene\.([A-Za-z0-9]{16})\.([A-Za-z]+)\.([A-Za-z0-9]{16})(?:\.RegionBehavior\.([A-Za-z0-9]{16}))?$/;

// adjustDarknessLevel MODES.OVERRIDE (client/data/region-behaviors/adjust-darkness-level.mjs).
const DARKNESS_MODE_OVERRIDE = 0;

// CONST.DRAWING_FILL_TYPES.NONE
const DRAWING_FILL_NONE = 0;

export function parseSceneUuid(uuid: string): IMetaSceneUuid | null {
  const m = typeof uuid === "string" ? uuid.match(SCENE_UUID) : null;
  if (!m) return null;
  return { sceneId: m[1], type: m[2], id: m[3], behaviorId: m[4] ?? null };
}

function buildUuid(sceneId: string, parsed: IMetaSceneUuid): string {
  const base = `Scene.${sceneId}.${parsed.type}.${parsed.id}`;
  return parsed.behaviorId ? `${base}.RegionBehavior.${parsed.behaviorId}` : base;
}

/**
 * Resolve an author-world UUID against an index of meta scenes. The scene part is trusted only when the
 * export recorded the authoring scene's id (`flags.ddb.sourceSceneId`); otherwise an export link (written
 * by SceneEnhancerExport for cross-scene targets) is used, and finally a region id that exactly one
 * indexed scene holds. Returns the rewritten UUID or null.
 */
export function resolveMetaUuid(uuid: string, index: IMetaRegionIndex, link?: IMetaRegionLink | null): string | null {
  const parsed = parseSceneUuid(uuid);
  if (!parsed || parsed.type !== "Region") return null;

  const holds = (entry: IMetaRegionIndexScene, regionId: string, behaviorId: string | null) => {
    const region = entry.regions.get(regionId);
    return !!region && (!behaviorId || region.has(behaviorId));
  };

  const bySource = index.bySourceSceneId.get(parsed.sceneId);
  if (bySource && holds(bySource, parsed.id, parsed.behaviorId)) return buildUuid(bySource.sceneId, parsed);

  if (link) {
    const entry = (link.contentChunkId ? index.byContentChunkId.get(`${link.bookCode}/${link.contentChunkId}`) : undefined)
      ?? (link.ddbId != null ? index.byDdbId.get(`${link.bookCode}/${link.ddbId}`) : undefined);
    const regionId = link.regionId ?? parsed.id;
    if (entry && holds(entry, regionId, parsed.behaviorId)) {
      return buildUuid(entry.sceneId, { ...parsed, id: regionId });
    }
  }

  const holders = index.scenes.filter((entry) => holds(entry, parsed.id, parsed.behaviorId));
  if (holders.length === 1) return buildUuid(holders[0].sceneId, parsed);
  return null;
}

/** Build a relink index from meta scenes (one scene-info file, or every enriched scene in a book). */
export function buildMetaRegionIndex(scenes: IMetaRegionIndexScene[]): IMetaRegionIndex {
  const index: IMetaRegionIndex = {
    scenes,
    bySourceSceneId: new Map(),
    byContentChunkId: new Map(),
    byDdbId: new Map(),
  };
  for (const entry of scenes) {
    if (entry.sourceSceneId) index.bySourceSceneId.set(entry.sourceSceneId, entry);
    if (entry.bookCode && entry.contentChunkId) index.byContentChunkId.set(`${entry.bookCode}/${entry.contentChunkId}`, entry);
    if (entry.bookCode && entry.ddbId != null) index.byDdbId.set(`${entry.bookCode}/${entry.ddbId}`, entry);
  }
  return index;
}

/** The index entry for regions as they appear in data (scene-info JSON or a world scene's source). */
export function metaIndexEntry(
  sceneId: string,
  regions: { _id?: string | null; behaviors?: { _id?: string | null }[] }[],
  identity: IMetaSceneIdentity,
): IMetaRegionIndexScene {
  const map = new Map<string, Set<string>>();
  for (const region of regions ?? []) {
    if (!region?._id) continue;
    map.set(region._id, new Set((region.behaviors ?? []).flatMap((b) => (b?._id ? [b._id] : []))));
  }
  return { sceneId, regions: map, ...identity };
}

/**
 * Walk a behaviour's system data and rewrite every scene-embedded UUID. Strings that resolve are replaced;
 * strings that do not are removed (from arrays) or nulled (scalars) and returned, so Foundry never follows
 * a dead UUID and the relink pass can restore them. Relative UUIDs and UUIDs outside scenes (actors,
 * items, compendium entries) are left alone.
 */
export function rewriteBehaviorUuids(
  system: any,
  resolve: (uuid: string) => string | null,
): IMetaUnresolvedUuid[] {
  const unresolved: IMetaUnresolvedUuid[] = [];

  const visit = (value: any, path: string): any => {
    if (typeof value === "string") {
      if (!parseSceneUuid(value)) return value;
      const resolved = resolve(value);
      if (resolved) return resolved;
      unresolved.push({ path, uuid: value, array: false });
      return null;
    }
    if (Array.isArray(value)) {
      const out: any[] = [];
      for (const item of value) {
        if (typeof item === "string" && parseSceneUuid(item)) {
          const resolved = resolve(item);
          if (resolved) out.push(resolved);
          else unresolved.push({ path, uuid: item, array: true });
        } else {
          out.push(visit(item, path));
        }
      }
      return out;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        value[key] = visit(child, path ? `${path}.${key}` : key);
      }
    }
    return value;
  };

  visit(system, "");
  return unresolved;
}

/**
 * Prepare a meta region for createEmbeddedDocuments(..., { keepId: true }): drop author-world internals,
 * keep only level ids the scene has, stamp the meta-data marker, and rewrite behaviour UUIDs. A teleport
 * left with no destinations is created disabled so it cannot fire into nothing; the relink pass
 * re-enables it once its destinations resolve.
 */
export function prepareMetaRegion(
  source: any,
  { levelIds, resolve, links }: {
    levelIds: Set<string>;
    resolve: (uuid: string) => string | null;
    links?: Record<string, IMetaRegionLink> | null;
  },
): { data: any; unresolved: number } {
  const region = foundry.utils.deepClone(source);
  delete region._stats;
  delete region.ownership;
  delete region._shapeConstraints;

  const levels = Array.isArray(region.levels) ? region.levels.filter((id: string) => levelIds.has(id)) : [];
  region.levels = levels;

  let unresolvedCount = 0;
  region.behaviors = (region.behaviors ?? []).map((behavior: any) => {
    delete behavior._stats;
    const unresolved = rewriteBehaviorUuids(behavior.system ?? {}, resolve);
    if (unresolved.length === 0) return behavior;
    unresolvedCount += unresolved.length;
    const withLinks = unresolved.map((u) => (links?.[u.uuid] ? { ...u, link: links[u.uuid] } : u));
    const emptiedTeleport = behavior.type === "teleportToken"
      && Array.isArray(behavior.system?.destinations) && behavior.system.destinations.length === 0;
    foundry.utils.setProperty(behavior, "flags.ddbimporter.unresolvedUuids", withLinks);
    if (emptiedTeleport && !behavior.disabled) {
      behavior.disabled = true;
      foundry.utils.setProperty(behavior, "flags.ddbimporter.disabledUnresolved", true);
    }
    return behavior;
  });

  foundry.utils.setProperty(region, "flags.ddbimporter.source", META_REGION_SOURCE);
  return { data: region, unresolved: unresolvedCount };
}

/**
 * Re-point a world region's parked UUIDs with a book-wide index. Returns the behaviour updates to apply
 * (empty when nothing changed) and how many UUIDs are still unresolved.
 */
export function relinkRegionBehaviors(
  behaviors: any[],
  index: IMetaRegionIndex,
): { updates: any[]; remaining: number } {
  const updates: any[] = [];
  let remaining = 0;
  for (const behavior of behaviors) {
    const parked = (foundry.utils.getProperty(behavior, "flags.ddbimporter.unresolvedUuids") ?? []) as IMetaUnresolvedUuid[];
    if (!Array.isArray(parked) || parked.length === 0) continue;
    const system = foundry.utils.deepClone(behavior.system ?? {});
    const still: IMetaUnresolvedUuid[] = [];
    for (const entry of parked) {
      const resolved = resolveMetaUuid(entry.uuid, index, entry.link);
      if (!resolved) {
        still.push(entry);
        continue;
      }
      const current = entry.path ? foundry.utils.getProperty(system, entry.path) : undefined;
      if (entry.array) {
        const list = Array.isArray(current) ? current : [];
        if (!list.includes(resolved)) list.push(resolved);
        foundry.utils.setProperty(system, entry.path, list);
      } else {
        foundry.utils.setProperty(system, entry.path, resolved);
      }
    }
    remaining += still.length;
    if (still.length === parked.length) continue;
    const update: any = { _id: behavior._id, system, "flags.ddbimporter.unresolvedUuids": still };
    if (still.length === 0 && foundry.utils.getProperty(behavior, "flags.ddbimporter.disabledUnresolved")) {
      update.disabled = false;
      update["flags.ddbimporter.disabledUnresolved"] = false;
    }
    updates.push(update);
  }
  return { updates, remaining };
}

// -------- drawings --------

/**
 * Foundry 14's DrawingDocument joint validation (BaseDrawing._validateVisibleContent): a drawing must
 * have a non-degenerate shape and visible text, fill or line, or the whole create call rejects it.
 * Mirrored here so meta drawings can be filtered before create.
 */
export function drawingHasVisibleContent(drawing: any): boolean {
  const shape = drawing?.shape ?? {};
  const strokeWidth = drawing.strokeWidth ?? 8;
  let isEmpty = false;
  switch (shape.type) {
    case "r":
    case "e": isEmpty = (shape.width <= strokeWidth) || (shape.height <= strokeWidth); break;
    case "p": isEmpty = ((shape.width === 0) && (shape.height === 0)) || ((shape.points?.length ?? 0) < 4); break;
    case "c": isEmpty = (shape.radius <= (strokeWidth / 2)); break;
    // no default
  }
  if (isEmpty) return false;
  const hasText = (drawing.text ?? "") !== "" && (drawing.textAlpha ?? 1) > 0;
  const hasFill = (drawing.fillType ?? DRAWING_FILL_NONE) !== DRAWING_FILL_NONE && (drawing.fillAlpha ?? 0.5) > 0;
  const hasLine = strokeWidth > 0 && (drawing.strokeAlpha ?? 1) > 0;
  return hasText || hasFill || hasLine;
}

/** A Perfect Vision lighting area that sets its own darkness level. */
export function isPerfectVisionDarknessArea(drawing: any): boolean {
  const pv = drawing?.flags?.["perfect-vision"];
  return !!pv?.active && Number.isFinite(pv.darkness);
}

function rotatePoint(x: number, y: number, cx: number, cy: number, radians: number): [number, number] {
  if (!radians) return [x, y];
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + (dx * cos) - (dy * sin), cy + (dx * sin) + (dy * cos)];
}

/**
 * Convert a Perfect Vision darkness drawing to a core region. Perfect Vision set the area's darkness level
 * to `darkness` outright (scripts/core/lighting-system.js), which is adjustDarknessLevel's OVERRIDE mode.
 * Drawing points are relative to the drawing's x/y and rotate about its centre; region shapes are
 * absolute, so rotated rectangles become polygons. Returns null for a shape it cannot place.
 */
export function perfectVisionDrawingToRegion(drawing: any, levelIds: string[]): any | null {
  if (!isPerfectVisionDarknessArea(drawing)) return null;
  const shape = drawing.shape ?? {};
  const x = Number(drawing.x ?? 0);
  const y = Number(drawing.y ?? 0);
  const width = Number(shape.width ?? 0);
  const height = Number(shape.height ?? 0);
  const cx = x + (width / 2);
  const cy = y + (height / 2);
  const radians = (Number(drawing.rotation ?? 0) * Math.PI) / 180;

  let regionShape: any = null;
  if (shape.type === "p" && Array.isArray(shape.points) && shape.points.length >= 6) {
    const points: number[] = [];
    for (let i = 0; i < shape.points.length - 1; i += 2) {
      points.push(...rotatePoint(x + shape.points[i], y + shape.points[i + 1], cx, cy, radians));
    }
    regionShape = { type: "polygon", points, hole: false };
  } else if (shape.type === "r" && width > 0 && height > 0) {
    if (radians) {
      const corners = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      regionShape = {
        type: "polygon",
        points: corners.flatMap(([px, py]) => rotatePoint(px, py, cx, cy, radians)),
        hole: false,
      };
    } else {
      regionShape = { type: "rectangle", x, y, width, height, rotation: 0, hole: false };
    }
  } else if (shape.type === "e" && width > 0 && height > 0) {
    regionShape = {
      type: "ellipse", x: cx, y: cy, radiusX: width / 2, radiusY: height / 2,
      rotation: Number(drawing.rotation ?? 0), hole: false,
    };
  }
  if (!regionShape) return null;

  const darkness = Math.min(1, Math.max(0, Number(drawing.flags["perfect-vision"].darkness)));
  return {
    name: `Darkness ${darkness}`,
    color: "#000000",
    shapes: [regionShape],
    levels: levelIds,
    elevation: { bottom: null, top: null },
    visibility: 0,
    behaviors: [{
      name: "Adjust Darkness Level",
      type: "adjustDarknessLevel",
      system: { mode: DARKNESS_MODE_OVERRIDE, modifier: darkness },
      disabled: false,
    }],
    flags: { ddbimporter: { source: META_REGION_SOURCE, convertedFrom: "perfect-vision" } },
  };
}
