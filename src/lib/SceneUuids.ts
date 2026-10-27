// Scene-embedded document UUIDs inside region behaviour data (teleport destinations, toggled behaviours,
// applied effects). Shared by the meta-data region import, the scene export and the region link repair, so
// they agree on what a scene UUID is and where one sits. Import-free, so the unit-tested modules that use
// it stay dependency-free.

// Scene.<sceneId>.<Type>.<id>[.RegionBehavior.<behaviorId>]
const SCENE_UUID = /^Scene\.([A-Za-z0-9]{16})\.([A-Za-z]+)\.([A-Za-z0-9]{16})(?:\.RegionBehavior\.([A-Za-z0-9]{16}))?$/;

/**
 * The absolute form of a relative UUID, read from `origin` (the absolute UUID of the document holding
 * it), as Foundry's _resolveRelativeUuid does. Foundry 14 stores teleport destinations and toggled
 * behaviours relative to their behaviour (`relativize: true`): a region on the same scene is `..<id>`,
 * a behaviour of the same region `.<id>`. Each leading dot after the first steps up one parent; an even
 * part count names its own child type below that document, an odd one a sibling of that document's
 * type. Returns null for a non-relative string or an origin it cannot walk.
 */
export function resolveRelativeUuid(uuid: string, origin: string): string | null {
  if (typeof uuid !== "string" || !uuid.startsWith(".") || typeof origin !== "string") return null;
  const chain = origin.split(".");
  if (chain.length < 2 || chain.length % 2 !== 0 || chain[0] === "Compendium") return null;
  let k = 1;
  while (uuid.at(k) === ".") k++;
  const rest = uuid.substring(k);
  // the document the UUID is relative to: the origin, then one parent per extra dot
  const depth = chain.length / 2 - (k - 1);
  if (depth < 1) return null;
  const relative = chain.slice(0, depth * 2);
  if (!rest) return relative.join(".");
  const parts = rest.split(".");
  if (parts.length % 2 === 0) return [...relative, ...parts].join(".");
  // a sibling of the relative document: its type, under its parent (or a primary document of its type)
  return [...relative.slice(0, -1), ...parts].join(".");
}

/**
 * Parse a scene-embedded UUID. A relative UUID is read against `origin`, the absolute UUID of the
 * behaviour holding it; without one it is not parsed.
 */
export function parseSceneUuid(uuid: string, origin?: string | null): IMetaSceneUuid | null {
  if (typeof uuid !== "string") return null;
  const absolute = uuid.startsWith(".") ? (origin ? resolveRelativeUuid(uuid, origin) : null) : uuid;
  const m = absolute?.match(SCENE_UUID);
  if (!m) return null;
  return { sceneId: m[1], type: m[2], id: m[3], behaviorId: m[4] ?? null };
}

/** The absolute UUID of a parsed scene UUID. */
export function sceneUuidString(parsed: IMetaSceneUuid): string {
  const base = `Scene.${parsed.sceneId}.${parsed.type}.${parsed.id}`;
  return parsed.behaviorId ? `${base}.RegionBehavior.${parsed.behaviorId}` : base;
}

/** The absolute UUID of a region behaviour, the origin its relative UUIDs are read against. */
export function behaviorUuid(sceneId: string, regionId: string, behaviorId: string): string {
  return `Scene.${sceneId}.Region.${regionId}.RegionBehavior.${behaviorId}`;
}

/**
 * Visit every scene UUID in `value` (behaviour system data). `fn` gets the UUID in absolute form (a
 * relative one is read against `origin`, the holding behaviour's UUID, and skipped without one) and
 * returns the replacement, the same string to keep the original as written (or its absolute form, with
 * `absolute`), or null to drop it: an array
 * item is removed, a property is set to null. `path` is the dotted path the UUID sits at, usable with
 * foundry.utils.getProperty/setProperty: an array of UUIDs reports the array's path (with `inArray`), an
 * object inside an array its index after earlier drops. Objects are changed in place; returns the new
 * value for `value` itself.
 */
export function walkSceneUuids(
  value: any,
  fn: (uuid: string, parsed: IMetaSceneUuid, path: string, inArray: boolean) => string | null,
  { origin = null, absolute = false }: { origin?: string | null; absolute?: boolean } = {},
): any {
  const apply = (raw: string, parsed: IMetaSceneUuid, path: string, inArray: boolean): string | null => {
    const full = raw.startsWith(".") ? sceneUuidString(parsed) : raw;
    const next = fn(full, parsed, path, inArray);
    return next === full && !absolute ? raw : next;
  };
  const visit = (node: any, path: string): any => {
    if (typeof node === "string") {
      const parsed = parseSceneUuid(node, origin);
      return parsed ? apply(node, parsed, path, false) : node;
    }
    if (Array.isArray(node)) {
      const out: any[] = [];
      for (const item of node) {
        const parsed = typeof item === "string" ? parseSceneUuid(item, origin) : null;
        if (parsed) {
          const next = apply(item, parsed, path, true);
          if (next !== null) out.push(next);
        } else {
          out.push(visit(item, `${path}.${out.length}`));
        }
      }
      return out;
    }
    if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node)) node[key] = visit(child, path ? `${path}.${key}` : key);
    }
    return node;
  };
  return visit(value, "");
}

/**
 * Rewrite every relative scene UUID in `value` to its absolute form, read against `origin`. Used before
 * behaviour data moves to another document (a region copy), where a relative UUID would be read against
 * the copy instead. Changes `value` in place and returns it.
 */
export function absolutizeSceneUuids(value: any, origin: string): any {
  return walkSceneUuids(value, (uuid) => uuid, { origin, absolute: true });
}
