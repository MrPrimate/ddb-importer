// Region behaviours point at other regions by UUID (teleport destinations, toggled behaviours). Copying
// regions to another scene or level gives the copies new ids, so their links keep pointing at the
// originals. The level copy tool tags each copy with the region it came from
// (flags.ddbimporter.copiedFrom) and then re-points links onto the copies; repair() does the same for
// scenes copied before that tag existed. For those it can also fall back to a unique region name, but only
// when asked for one scene: an untagged copy and its original look the same (name, links, and creation
// order changes when a scene is re-imported), so on an original the fallback would re-point a deliberate
// cross-scene link onto a local region that shares the target's name. A copy onto another level
// of the same scene still has its originals beside it, so the copy pass passes the batch it just created:
// links held by those copies follow the batch even though the original they name still exists.

import logger from "./Logger";
import { walkSceneUuids } from "./SceneUuids";

const COPIED_FROM = "flags.ddbimporter.copiedFrom";

/**
 * Visit every scene region UUID inside behaviour system data. `fn` returns the replacement (or the same
 * string to keep it). Returns true when anything changed.
 */
function mapRegionUuids(system: any, fn: (uuid: string, parsed: IMetaSceneUuid) => string): boolean {
  let changed = false;
  walkSceneUuids(system, (uuid, parsed) => {
    if (parsed.type !== "Region") return uuid;
    const next = fn(uuid, parsed);
    if (next !== uuid) changed = true;
    return next;
  });
  return changed;
}

function regionsOf(scene: Scene): RegionDocument[] {
  return (scene.regions?.contents ?? []) as RegionDocument[];
}

function baseRegionUuid(sceneId: string, regionId: string): string {
  return `Scene.${sceneId}.Region.${regionId}`;
}

/** Regions created by one copy, keyed by the UUID of the region each was copied from. */
type TCopyBatch = Map<string, RegionDocument>;

/**
 * Work out where one link should point on `scene`, or why it cannot be re-pointed. Links already on
 * this scene are left alone, unless the holder belongs to `batch` and the target was copied in that
 * batch too; links to a region that has a copy on this scene move to the copy.
 */
function resolveLink(
  scene: Scene, holder: RegionDocument, parsed: IMetaSceneUuid, useNames: boolean, batch?: TCopyBatch,
): ISceneRegionLinkRow["status"] | { to: string } {
  const { sceneId, id: regionId, behaviorId } = parsed;
  const base = baseRegionUuid(sceneId, regionId);
  const holderInBatch = !!batch && [...batch.values()].some((r) => r.id === holder.id);
  const batchCopy = holderInBatch ? batch!.get(base) : undefined;
  if (!batchCopy && sceneId === scene.id && scene.regions?.get(regionId)) return "ok";

  // earlier copies of the same original carry the same tag, so a batch copy is the only safe pick
  let copies = batchCopy
    ? [batchCopy]
    : regionsOf(scene).filter((r) => foundry.utils.getProperty(r, COPIED_FROM) === base);

  const original = fromUuidSync(base) as RegionDocument | null;
  if (copies.length === 0 && useNames && original?.name) {
    // a stair pair often shares one name, so the region holding the link is never its own target
    copies = regionsOf(scene).filter((r) => r.id !== holder.id && r.name === original.name
      && !foundry.utils.getProperty(r, COPIED_FROM));
  }
  if (copies.length > 1) return "ambiguous";
  if (copies.length === 0) {
    if (!original) return "dangling";
    return sceneId === scene.id ? "dangling" : "cross-scene";
  }

  const copy = copies[0];
  let to = baseRegionUuid(scene.id!, copy.id!);
  if (behaviorId) {
    const sourceBehavior = original?.behaviors?.get(behaviorId);
    const behavior = copy.behaviors?.get(behaviorId)
      ?? (sourceBehavior
        ? copy.behaviors?.find((b) => b.type === sourceBehavior.type && b.name === sourceBehavior.name)
        : undefined);
    if (!behavior) return "dangling";
    to = `${to}.RegionBehavior.${behavior.id}`;
  }
  return { to };
}

/**
 * Report (and with `apply` rewrite) the region links on a scene. `useNames` matches a link's original
 * region to a unique region of the same name when no copiedFrom tag exists, for a scene copied before the
 * tag. Only use it on a scene known to be a copy: on an original it re-points deliberate cross-scene links.
 */
export async function repairSceneRegionLinks(
  scene: Scene,
  { apply = false, useNames = false, batch }: { apply?: boolean; useNames?: boolean; batch?: TCopyBatch } = {},
): Promise<ISceneRegionLinkRow[]> {
  const rows: ISceneRegionLinkRow[] = [];
  for (const region of regionsOf(scene)) {
    for (const behavior of (region.behaviors?.contents ?? []) as RegionBehavior[]) {
      const system = foundry.utils.deepClone((behavior.toObject() as any).system ?? {});
      const changed = mapRegionUuids(system, (uuid, parsed) => {
        const outcome = resolveLink(scene, region, parsed, useNames, batch);
        const row: ISceneRegionLinkRow = {
          scene: scene.name ?? "", region: region.name ?? "", behavior: behavior.name || behavior.type || "",
          uuid, status: typeof outcome === "string" ? outcome : "remapped",
        };
        if (typeof outcome !== "string") row.to = outcome.to;
        rows.push(row);
        return typeof outcome === "string" ? uuid : outcome.to;
      });
      if (apply && changed) await behavior.update({ system } as any);
    }
  }
  if (apply) {
    const remapped = rows.filter((r) => r.status === "remapped").length;
    if (remapped) logger.info(`SceneRegionLinks: re-pointed ${remapped} region link(s) on "${scene.name}"`);
  }
  return rows;
}

/**
 * Report or repair every scene in the world by copiedFrom tags; only scenes with links appear in the
 * result. Name matching is never used here, since it is only safe on a scene known to be a copy.
 */
export async function repairAllRegionLinks(
  { apply = false }: { apply?: boolean } = {},
): Promise<ISceneRegionLinkRow[]> {
  const rows: ISceneRegionLinkRow[] = [];
  for (const scene of (game.scenes?.contents ?? []) as Scene[]) {
    rows.push(...await repairSceneRegionLinks(scene, { apply }));
  }
  return rows;
}

/** Tag projected region copies with the region each came from (call before creating them). */
export function tagRegionCopy(data: any, source: RegionDocument): void {
  foundry.utils.setProperty(data, COPIED_FROM, source.uuid);
}

/**
 * After copying regions onto a scene, move links (on any region of that scene) onto the copies. `created`
 * is the regions this copy made: their links into the same batch move onto it even when the originals are
 * on this scene (a copy to another level), and they win over copies an earlier run left.
 */
export async function remapCopiedRegionLinks(scene: Scene, created: RegionDocument[] = []): Promise<number> {
  const batch: TCopyBatch = new Map();
  for (const region of created) {
    const from = foundry.utils.getProperty(region, COPIED_FROM);
    if (typeof from === "string") batch.set(from, region);
  }
  const rows = await repairSceneRegionLinks(scene, { apply: true, useNames: false, batch });
  return rows.filter((r) => r.status === "remapped").length;
}
