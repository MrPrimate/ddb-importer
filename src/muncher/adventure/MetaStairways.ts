// Meta-data stairways: the Stairways module pairs two stairway pads by their shared `name`, and a pad's
// `scene` names the scene its partner is on (null when the partner is on the same scene). Meta-data pads
// carry the authoring world's scene ids, which an importing world only has when its scene ids came from
// the same muncher zip. Everywhere else they point at nothing, so once a book's scenes exist each
// dangling pad is re-pointed at the world scene now holding that author scene's meta-data.

/** The pad list from a scene's flags.stairways, which is an array before Stairways 0.10.7 and `{ data }` after. */
export function stairwayList(flag: any): any[] {
  if (Array.isArray(flag)) return flag;
  if (Array.isArray(flag?.data)) return flag.data;
  return [];
}

function identityKey(bookCode: string | null | undefined, id: string | number | null | undefined): string | null {
  return bookCode && id != null && id !== "" ? `${bookCode}/${id}` : null;
}

/** Map keys to the one scene id each names; a key two scenes share names neither. */
function uniqueIndex(pairs: [string | null, string][]): Map<string, string> {
  const index = new Map<string, string | null>();
  for (const [key, sceneId] of pairs) {
    if (!key) continue;
    const held = index.get(key);
    if (held === undefined) index.set(key, sceneId);
    else if (held !== sceneId) index.set(key, null);
  }
  return new Map([...index].filter((entry): entry is [string, string] => entry[1] !== null));
}

/**
 * Re-point every dangling cross-scene pad in a set of scenes. A pad dangles when its `scene` is set, is
 * not the pad's own scene, and `exists` does not know it. Its target is found, in order, from:
 * - a scene whose meta file recorded that author scene id (`sourceSceneId`, newer exports);
 * - the export's link for that id on the pad's own scene (`links`, matched on the target's meta identity),
 *   which wins over an author id match outside the `primary` scenes when it finds one among them;
 * - the one scene holding the pad's partner (the other pad with the same `name`), looking at the
 *   `primary` scenes (this import) before the rest;
 * - the scene other pads pointing at the same author scene id were matched to, for pads without a partner.
 * The last two match on pad names and votes, so they are only used for pads with no explicit destination:
 * when a scene recorded that author id or the pad's scene carries a link for it, that destination is the
 * only answer, and a pad whose destination is missing or ambiguous stays unresolved rather than landing on
 * another floor that reuses its name. Ambiguous answers are never taken. A target on the pad's own scene
 * becomes null, as Stairways expects.
 */
export function relinkStairways(
  scenes: IMetaStairwayScene[],
  exists: (sceneId: string) => boolean,
): IMetaStairwayRelink[] {
  // an identity two scenes share is settled by the one among the scenes being imported, as for regions
  const indexed = (key: (s: IMetaStairwayScene) => string | null) => {
    const all = uniqueIndex(scenes.map((s) => [key(s), s.sceneId]));
    const primary = uniqueIndex(scenes.filter((s) => s.primary).map((s) => [key(s), s.sceneId]));
    return { get: (k: string) => all.get(k) ?? primary.get(k) };
  };
  const bySource = indexed((s) => s.identity?.sourceSceneId ?? null);
  const byChunk = indexed((s) => identityKey(s.identity?.bookCode, s.identity?.contentChunkId));
  const byDdbId = indexed((s) => identityKey(s.identity?.bookCode, s.identity?.ddbId));
  const knownSources = new Set(scenes.flatMap((s) => (s.identity?.sourceSceneId ? [s.identity.sourceSceneId] : [])));
  const explicit = (scene: IMetaStairwayScene, authorId: string): boolean =>
    knownSources.has(authorId) || !!scene.links?.[authorId];

  const padsByName = new Map<string, { scene: IMetaStairwayScene; pad: any }[]>();
  for (const scene of scenes) {
    for (const pad of scene.stairs) {
      if (typeof pad?.name !== "string" || pad.name === "") continue;
      const list = padsByName.get(pad.name) ?? [];
      list.push({ scene, pad });
      padsByName.set(pad.name, list);
    }
  }

  const dangles = (scene: IMetaStairwayScene, pad: any): boolean =>
    typeof pad?.scene === "string" && pad.scene !== "" && pad.scene !== scene.sceneId && !exists(pad.scene);

  const partnerScene = (pad: any): string | null => {
    const others = (padsByName.get(pad.name) ?? []).filter((p) => p.pad !== pad);
    for (const tier of [others.filter((p) => p.scene.primary), others.filter((p) => !p.scene.primary)]) {
      const ids = new Set(tier.map((p) => p.scene.sceneId));
      if (ids.size === 1) return [...ids][0];
      if (ids.size > 1) return null;
    }
    return null;
  };

  const linkedScene = (scene: IMetaStairwayScene, authorId: string): string | null => {
    const link = scene.links?.[authorId];
    if (!link) return null;
    return byChunk.get(identityKey(link.bookCode, link.contentChunkId) ?? "")
      ?? byDdbId.get(identityKey(link.bookCode, link.ddbId) ?? "")
      ?? null;
  };

  // The author id comes first, as floor clones share the chunk and DDB ids a link matches on. When it
  // names a scene outside this import (an older copy whose meta-data still had that id) and the link
  // names one inside it, the target's id changed between exports and the link is current.
  const primaryIds = new Set(scenes.filter((s) => s.primary).map((s) => s.sceneId));
  const explicitScene = (scene: IMetaStairwayScene, authorId: string): string | null => {
    const source = bySource.get(authorId) ?? null;
    const linked = linkedScene(scene, authorId);
    if (source && linked && !primaryIds.has(source) && primaryIds.has(linked)) return linked;
    return source ?? linked;
  };

  // first pass: every dangling pad resolvable without the vote; the matches it makes are the votes
  const resolved = new Map<any, string>();
  const votes: [string, string][] = [];
  for (const scene of scenes) {
    for (const pad of scene.stairs) {
      if (!dangles(scene, pad)) continue;
      const target = explicit(scene, pad.scene) ? explicitScene(scene, pad.scene) : partnerScene(pad);
      if (!target) continue;
      resolved.set(pad, target);
      votes.push([pad.scene, target]);
    }
  }
  const byVote = uniqueIndex(votes);

  const results: IMetaStairwayRelink[] = [];
  for (const scene of scenes) {
    let relinked = 0;
    let unresolved = 0;
    const stairs = scene.stairs.map((pad) => {
      if (!dangles(scene, pad)) return pad;
      const target = resolved.get(pad) ?? (explicit(scene, pad.scene) ? undefined : byVote.get(pad.scene));
      if (!target) {
        unresolved += 1;
        return pad;
      }
      relinked += 1;
      return { ...pad, scene: target === scene.sceneId ? null : target };
    });
    if (relinked || unresolved) results.push({ sceneId: scene.sceneId, stairs, relinked, unresolved });
  }
  return results;
}
