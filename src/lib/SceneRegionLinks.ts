// Region behaviours point at other regions by UUID (teleport destinations, toggled behaviours). Copying
// regions to another scene or level gives the copies new ids, so their links keep pointing at the
// originals. The level copy tool tags each copy with the region it came from
// (flags.ddbimporter.copiedFrom) and then re-points links onto the copies; repair() does the same for
// scenes copied before that tag existed, falling back to a unique region name. A copy onto another level
// of the same scene still has its originals beside it, so the copy pass passes the batch it just created:
// links held by those copies follow the batch even though the original they name still exists.

import logger from "./Logger";

const COPIED_FROM = "flags.ddbimporter.copiedFrom";

const REGION_UUID = /^Scene\.([A-Za-z0-9]{16})\.Region\.([A-Za-z0-9]{16})(?:\.RegionBehavior\.([A-Za-z0-9]{16}))?$/;

/**
 * Visit every scene region UUID inside behaviour system data. `fn` returns the replacement (or the same
 * string to keep it). Returns true when anything changed.
 */
function mapRegionUuids(system: any, fn: (uuid: string, path: string) => string): boolean {
  let changed = false;
  const visit = (value: any, path: string): any => {
    if (typeof value === "string") {
      if (!REGION_UUID.test(value)) return value;
      const next = fn(value, path);
      if (next !== value) changed = true;
      return next;
    }
    if (Array.isArray(value)) return value.map((item) => visit(item, path));
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) value[key] = visit(child, path ? `${path}.${key}` : key);
    }
    return value;
  };
  visit(system, "");
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
  scene: Scene, holder: RegionDocument, uuid: string, useNames: boolean, batch?: TCopyBatch,
): ISceneRegionLinkRow["status"] | { to: string } {
  const m = uuid.match(REGION_UUID)!;
  const [, sceneId, regionId, behaviorId] = m;
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
 * region to a copy by unique name when no copiedFrom tag exists, for scenes built before the tag.
 */
export async function repairSceneRegionLinks(
  scene: Scene,
  { apply = false, useNames = true, batch }: { apply?: boolean; useNames?: boolean; batch?: TCopyBatch } = {},
): Promise<ISceneRegionLinkRow[]> {
  const rows: ISceneRegionLinkRow[] = [];
  for (const region of regionsOf(scene)) {
    for (const behavior of (region.behaviors?.contents ?? []) as RegionBehavior[]) {
      const system = foundry.utils.deepClone((behavior.toObject() as any).system ?? {});
      const changed = mapRegionUuids(system, (uuid) => {
        const outcome = resolveLink(scene, region, uuid, useNames, batch);
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

/** Report or repair every scene in the world; only scenes with links appear in the result. */
export async function repairAllRegionLinks(
  options: { apply?: boolean; useNames?: boolean } = {},
): Promise<ISceneRegionLinkRow[]> {
  const rows: ISceneRegionLinkRow[] = [];
  for (const scene of (game.scenes?.contents ?? []) as Scene[]) {
    rows.push(...await repairSceneRegionLinks(scene, options));
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
