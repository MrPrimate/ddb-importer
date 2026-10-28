// Meta-data regions: the scene-info JSONs carry Region documents exported from the authoring world,
// with behaviour data that points at other documents there by UUID (teleport destinations, toggled
// behaviours, applied effects). Those UUIDs name the author's scene ids, which mean nothing in the
// importing world, so they are rewritten here: to the scene being built when the target is in the
// same file, or parked on a flag for the book-level relink pass when it is not.
//
// Also converts Perfect Vision darkness areas (drawings carrying flags.perfect-vision) into core
// adjustDarknessLevel regions, and decides which meta drawings Foundry 14 would reject.

import { behaviorUuid, parseSceneUuid, walkSceneUuids } from "../../lib/SceneUuids";

export const META_REGION_SOURCE = "meta-data";

// adjustDarknessLevel MODES.OVERRIDE (client/data/region-behaviors/adjust-darkness-level.mjs).
const DARKNESS_MODE_OVERRIDE = 0;

// CONST.DRAWING_FILL_TYPES.NONE
const DRAWING_FILL_NONE = 0;

function buildUuid(sceneId: string, parsed: IMetaSceneUuid): string {
  const base = `Scene.${sceneId}.${parsed.type}.${parsed.id}`;
  return parsed.behaviorId ? `${base}.RegionBehavior.${parsed.behaviorId}` : base;
}

/** The UUID a behaviour's relative UUIDs are read against, when its scene and ids are known. */
function behaviorOrigin(sceneId: string | null | undefined, regionId: string | null | undefined, behavior: any): string | null {
  return sceneId && regionId && behavior?._id ? behaviorUuid(sceneId, regionId, behavior._id) : null;
}

/**
 * Resolve an author-world UUID against an index of meta scenes. The scenes being imported are tried first:
 * by the authoring scene id the export recorded (`flags.ddb.sourceSceneId`), then by the export link
 * SceneEnhancerExport wrote for cross-scene targets. Earlier imports and copies are only trusted by
 * authoring id when there is no link (refreshed meta-data can change the authoring id, while the link
 * names the destination outright), and only when one of them claims it. Without either, a region id
 * that exactly one indexed scene of unknown or matching authoring id holds decides, preferring the
 * scenes being imported. Returns the rewritten UUID or null.
 */
export function resolveMetaUuid(uuid: string, index: IMetaRegionIndex, link?: IMetaRegionLink | null): string | null {
  const parsed = parseSceneUuid(uuid);
  if (!parsed || parsed.type !== "Region") return null;

  const holds = (entry: IMetaRegionIndexScene, regionId: string, behaviorId: string | null) => {
    const region = entry.regions.get(regionId);
    return !!region && (!behaviorId || region.has(behaviorId));
  };
  const isPrimary = (entry: IMetaRegionIndexScene) => index.scenes.indexOf(entry) < index.primaryCount;

  const bySource = index.bySourceSceneId.get(parsed.sceneId);
  const sourceHit = bySource && holds(bySource, parsed.id, parsed.behaviorId) ? bySource : null;
  if (sourceHit && isPrimary(sourceHit)) return buildUuid(sourceHit.sceneId, parsed);

  // an export link names the destination scene outright: when that scene is not indexed yet (or two
  // earlier copies of it are) the UUID stays parked for the book pass, rather than landing on another
  // scene that reuses the region id (floors cloned from one scene share their region ids)
  if (link) {
    const entry = (link.contentChunkId ? index.byContentChunkId.get(`${link.bookCode}/${link.contentChunkId}`) : undefined)
      ?? (link.ddbId != null ? index.byDdbId.get(`${link.bookCode}/${link.ddbId}`) : undefined);
    const regionId = link.regionId ?? parsed.id;
    if (entry && holds(entry, regionId, parsed.behaviorId)) {
      return buildUuid(entry.sceneId, { ...parsed, id: regionId });
    }
    return null;
  }

  if (sourceHit) return buildUuid(sourceHit.sceneId, parsed);

  // a scene whose authoring id is recorded and differs is known not to be the target
  const holders = index.scenes.filter((entry) =>
    (!entry.sourceSceneId || entry.sourceSceneId === parsed.sceneId)
    && holds(entry, parsed.id, parsed.behaviorId));
  if (holders.length === 1) return buildUuid(holders[0].sceneId, parsed);
  // older copies of a scene hold the same ids; one holder among the scenes being imported still decides
  const primary = holders.filter(isPrimary);
  if (primary.length === 1) return buildUuid(primary[0].sceneId, parsed);
  return null;
}

/**
 * Build a relink index from meta scenes (one scene-info file, or every enriched scene in a book). The
 * first `primaryCount` scenes are the ones being imported: for every identity they share with the rest
 * (earlier imports and copies of the same scenes) the first of them wins. An identity only the rest
 * share between two scenes is ambiguous and indexed as null, so neither is picked.
 */
export function buildMetaRegionIndex(scenes: IMetaRegionIndexScene[], primaryCount = scenes.length): IMetaRegionIndex {
  const index: IMetaRegionIndex = {
    scenes,
    primaryCount,
    bySourceSceneId: new Map(),
    byContentChunkId: new Map(),
    byDdbId: new Map(),
  };
  scenes.forEach((entry, i) => {
    const add = (map: Map<string, IMetaRegionIndexScene | null>, key: string) => {
      if (!map.has(key)) map.set(key, entry);
      else if (i >= primaryCount && map.get(key) !== null && scenes.indexOf(map.get(key)!) >= primaryCount) map.set(key, null);
    };
    if (entry.sourceSceneId) add(index.bySourceSceneId, entry.sourceSceneId);
    if (entry.bookCode && entry.contentChunkId) add(index.byContentChunkId, `${entry.bookCode}/${entry.contentChunkId}`);
    if (entry.bookCode && entry.ddbId != null) add(index.byDdbId, `${entry.bookCode}/${entry.ddbId}`);
  });
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
 * a dead UUID and the relink pass can restore them. Relative UUIDs (Foundry 14 stores same-scene
 * destinations as `..<regionId>`) are read against `origin`, the behaviour's author-world UUID, and
 * resolved and parked in their absolute form; without an origin they are left alone, as are UUIDs outside
 * scenes (actors, items, compendium entries). Other embedded types (Token, Tile...) are parked too so they
 * can be reported, but only region targets can be re-pointed: meta regions keep their ids, every other
 * placeable gets a new one.
 */
export function rewriteBehaviorUuids(
  system: any,
  resolve: (uuid: string) => string | null,
  origin?: string | null,
): IMetaUnresolvedUuid[] {
  const unresolved: IMetaUnresolvedUuid[] = [];

  walkSceneUuids(system, (uuid, _parsed, path, array) => {
    const resolved = resolve(uuid);
    if (resolved) return resolved;
    unresolved.push({ path, uuid, array });
    return null;
  }, { origin });
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
  { levelIds, resolve, links, sceneId }: {
    levelIds: Set<string>;
    resolve: (uuid: string) => string | null;
    links?: Record<string, IMetaRegionLink> | null;
    /** The author-world scene id the region was exported from, for reading relative UUIDs. */
    sceneId?: string | null;
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
    const unresolved = rewriteBehaviorUuids(behavior.system ?? {}, resolve, behaviorOrigin(sceneId, region._id, behavior));
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
 * (empty when nothing changed) and how many UUIDs are still unresolved. Each UUID placed is recorded on
 * flags.ddbimporter.resolvedUuids: one whose target `exists` no longer finds (a floor clone deleted and
 * cloned again by a re-import) is taken out of the system data and resolved again like a parked one, if
 * the system data still holds it.
 * `regionUuid` is the world UUID of the region holding the behaviours, for reading the relative UUIDs
 * Foundry stores; without it only absolute values are matched.
 */
export function relinkRegionBehaviors(
  behaviors: any[],
  index: IMetaRegionIndex,
  { exists = () => true, regionUuid = null }: { exists?: (uuid: string) => boolean; regionUuid?: string | null } = {},
): { updates: any[]; remaining: number } {
  const updates: any[] = [];
  let remaining = 0;
  for (const behavior of behaviors) {
    const parkedFlag = (foundry.utils.getProperty(behavior, "flags.ddbimporter.unresolvedUuids") ?? []) as IMetaUnresolvedUuid[];
    const resolvedFlag = (foundry.utils.getProperty(behavior, "flags.ddbimporter.resolvedUuids") ?? []) as IMetaResolvedUuid[];
    const parked = Array.isArray(parkedFlag) ? [...parkedFlag] : [];
    const placed = Array.isArray(resolvedFlag) ? [...resolvedFlag] : [];
    const stale = placed.filter((entry) => !exists(entry.resolved));
    if (parked.length === 0 && stale.length === 0) continue;

    const system = foundry.utils.deepClone(behavior.system ?? {});
    const origin = regionUuid && behavior._id ? `${regionUuid}.RegionBehavior.${behavior._id}` : null;
    // stored values can be relative (Foundry relativizes same-scene targets): compare absolute forms
    const absolute = (value: unknown): unknown => {
      if (typeof value !== "string" || !value.startsWith(".") || !origin) return value;
      const parsed = parseSceneUuid(value, origin);
      return parsed ? buildUuid(parsed.sceneId, parsed) : value;
    };
    // a record whose value is no longer in the system data was removed or replaced by the GM: drop it
    // rather than place it again
    let removed = 0;
    for (const entry of stale) {
      const current = entry.path ? foundry.utils.getProperty(system, entry.path) : undefined;
      if (entry.array) {
        const list = Array.isArray(current) ? current : [];
        const rest = list.filter((value) => absolute(value) !== entry.resolved);
        if (rest.length === list.length) continue;
        foundry.utils.setProperty(system, entry.path, rest);
      } else if (absolute(current) === entry.resolved) {
        foundry.utils.setProperty(system, entry.path, null);
      } else {
        continue;
      }
      removed += 1;
      const { resolved: _resolved, ...unplaced } = entry;
      parked.push(unplaced);
    }
    const kept = placed.filter((entry) => !stale.includes(entry));

    const still: IMetaUnresolvedUuid[] = [];
    for (const entry of parked) {
      const resolved = resolveMetaUuid(entry.uuid, index, entry.link);
      if (!resolved || !exists(resolved)) {
        still.push(entry);
        continue;
      }
      const current = entry.path ? foundry.utils.getProperty(system, entry.path) : undefined;
      if (entry.array) {
        const list = Array.isArray(current) ? current : [];
        if (!list.some((value) => absolute(value) === resolved)) list.push(resolved);
        foundry.utils.setProperty(system, entry.path, list);
      } else {
        foundry.utils.setProperty(system, entry.path, resolved);
      }
      kept.push({ ...entry, resolved });
    }
    remaining += still.length;
    if (stale.length === 0 && still.length === parked.length) continue;
    const update: any = {
      _id: behavior._id,
      system,
      "flags.ddbimporter.unresolvedUuids": still,
      "flags.ddbimporter.resolvedUuids": kept,
    };
    const disabledForLinks = foundry.utils.getProperty(behavior, "flags.ddbimporter.disabledUnresolved");
    const emptiedTeleport = behavior.type === "teleportToken"
      && Array.isArray(system.destinations) && system.destinations.length === 0;
    if (still.length === 0 && disabledForLinks) {
      update.disabled = false;
      update["flags.ddbimporter.disabledUnresolved"] = false;
    } else if (removed > 0 && emptiedTeleport && !behavior.disabled) {
      // its every destination went with the deleted scene: off until they are placed again
      update.disabled = true;
      update["flags.ddbimporter.disabledUnresolved"] = true;
    }
    updates.push(update);
  }
  return { updates, remaining };
}

/**
 * Put a behaviour's parked UUIDs back into its system data, as the meta file had them, and re-enable a
 * teleport that was disabled only for want of them. Used by the scene export, which strips the parking
 * flags: without this an unresolved destination would leave the export with no record of it. Mutates
 * the behaviour and returns the restored entries.
 */
export function restoreParkedUuids(behavior: any): IMetaUnresolvedUuid[] {
  const parked = (foundry.utils.getProperty(behavior, "flags.ddbimporter.unresolvedUuids") ?? []) as IMetaUnresolvedUuid[];
  if (!Array.isArray(parked) || parked.length === 0) return [];
  behavior.system ??= {};
  for (const entry of parked) {
    if (!entry.path) continue;
    const current = foundry.utils.getProperty(behavior.system, entry.path);
    if (entry.array) {
      const list = Array.isArray(current) ? current : [];
      if (!list.includes(entry.uuid)) list.push(entry.uuid);
      foundry.utils.setProperty(behavior.system, entry.path, list);
    } else if (current == null) {
      foundry.utils.setProperty(behavior.system, entry.path, entry.uuid);
    }
  }
  if (foundry.utils.getProperty(behavior, "flags.ddbimporter.disabledUnresolved")) behavior.disabled = false;
  return parked;
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
