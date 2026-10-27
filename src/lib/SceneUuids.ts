// Scene-embedded document UUIDs inside region behaviour data (teleport destinations, toggled behaviours,
// applied effects). Shared by the meta-data region import, the scene export and the region link repair, so
// they agree on what a scene UUID is and where one sits. Import-free, so the unit-tested modules that use
// it stay dependency-free.

// Scene.<sceneId>.<Type>.<id>[.RegionBehavior.<behaviorId>]
const SCENE_UUID = /^Scene\.([A-Za-z0-9]{16})\.([A-Za-z]+)\.([A-Za-z0-9]{16})(?:\.RegionBehavior\.([A-Za-z0-9]{16}))?$/;

export function parseSceneUuid(uuid: string): IMetaSceneUuid | null {
  const m = typeof uuid === "string" ? uuid.match(SCENE_UUID) : null;
  if (!m) return null;
  return { sceneId: m[1], type: m[2], id: m[3], behaviorId: m[4] ?? null };
}

/**
 * Visit every scene UUID in `value` (behaviour system data). `fn` returns the replacement, the same
 * string to keep it, or null to drop it: an array item is removed, a property is set to null. `path` is
 * the dotted path the UUID sits at, usable with foundry.utils.getProperty/setProperty: an array of UUIDs
 * reports the array's path (with `inArray`), an object inside an array its index after earlier drops.
 * Objects are changed in place; returns the new value for `value` itself.
 */
export function walkSceneUuids(
  value: any,
  fn: (uuid: string, parsed: IMetaSceneUuid, path: string, inArray: boolean) => string | null,
): any {
  const visit = (node: any, path: string): any => {
    if (typeof node === "string") {
      const parsed = parseSceneUuid(node);
      return parsed ? fn(node, parsed, path, false) : node;
    }
    if (Array.isArray(node)) {
      const out: any[] = [];
      for (const item of node) {
        const parsed = typeof item === "string" ? parseSceneUuid(item) : null;
        if (parsed) {
          const next = fn(item, parsed, path, true);
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
