import { describe, it, expect } from "vitest";
import { relinkStairways, stairwayList } from "../../../src/muncher/adventure/MetaStairways";

const AUTHOR_UPPER = "authorUpper00001";
const AUTHOR_LOWER = "authorLower00001";
const AUTHOR_ATTIC = "authorAttic00001";
const WORLD_UPPER = "worldUpper000001";
const WORLD_LOWER = "worldLower000001";
const WORLD_ATTIC = "worldAttic000001";

function pad(name: string, scene: string | null, extra: Record<string, any> = {}) {
  return { _id: `pad-${name}-${scene ?? "here"}`, name, scene, x: 100, y: 100, disabled: false, ...extra };
}

function scene(sceneId: string, stairs: any[], over: Partial<IMetaStairwayScene> = {}): IMetaStairwayScene {
  return { sceneId, stairs, identity: null, links: null, primary: true, ...over };
}

const nothingExists = () => false;

function byScene(results: IMetaStairwayRelink[]) {
  return Object.fromEntries(results.map((r) => [r.sceneId, r]));
}

describe("stairwayList", () => {
  it("reads both flag shapes", () => {
    const pads = [pad("a", null)];
    expect(stairwayList(pads)).toBe(pads);
    expect(stairwayList({ data: pads })).toBe(pads);
    expect(stairwayList(undefined)).toEqual([]);
    expect(stairwayList({})).toEqual([]);
  });
});

describe("relinkStairways", () => {
  it("re-points a pair of floors at each other by partner name", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-down", AUTHOR_LOWER)]),
      scene(WORLD_LOWER, [pad("sw-down", AUTHOR_UPPER)]),
    ], nothingExists));

    expect(results[WORLD_UPPER].stairs[0].scene).toBe(WORLD_LOWER);
    expect(results[WORLD_LOWER].stairs[0].scene).toBe(WORLD_UPPER);
    expect(results[WORLD_UPPER].relinked).toBe(1);
    expect(results[WORLD_UPPER].unresolved).toBe(0);
  });

  it("leaves same-scene pads and pads whose target exists alone", () => {
    const results = relinkStairways([
      scene(WORLD_UPPER, [pad("sw-local", null), pad("sw-local", null), pad("sw-kept", WORLD_LOWER)]),
      scene(WORLD_LOWER, [pad("sw-kept", WORLD_UPPER)]),
    ], (id) => id === WORLD_LOWER || id === WORLD_UPPER);

    expect(results).toEqual([]);
  });

  it("sets a target on the pad's own scene to null", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-loop", AUTHOR_UPPER), pad("sw-loop", AUTHOR_UPPER, { x: 500 })]),
    ], nothingExists));

    expect(results[WORLD_UPPER].stairs.map((p: any) => p.scene)).toEqual([null, null]);
  });

  it("does not mutate the pads it is given", () => {
    const upper = [pad("sw-down", AUTHOR_LOWER)];
    relinkStairways([scene(WORLD_UPPER, upper), scene(WORLD_LOWER, [pad("sw-down", AUTHOR_UPPER)])], nothingExists);
    expect(upper[0].scene).toBe(AUTHOR_LOWER);
  });

  it("resolves a pad without a partner from the other pads naming the same author scene", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-down", AUTHOR_LOWER), pad("sw-orphan", AUTHOR_LOWER)]),
      scene(WORLD_LOWER, [pad("sw-down", AUTHOR_UPPER)]),
    ], nothingExists));

    expect(results[WORLD_UPPER].stairs.map((p: any) => p.scene)).toEqual([WORLD_LOWER, WORLD_LOWER]);
  });

  it("reports a pad it cannot resolve and keeps its target", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-gone", AUTHOR_ATTIC)]),
    ], nothingExists));

    expect(results[WORLD_UPPER].relinked).toBe(0);
    expect(results[WORLD_UPPER].unresolved).toBe(1);
    expect(results[WORLD_UPPER].stairs[0].scene).toBe(AUTHOR_ATTIC);
  });

  it("does not guess when a partner name is on two scenes of the import", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-dup", AUTHOR_LOWER)]),
      scene(WORLD_LOWER, [pad("sw-dup", AUTHOR_UPPER)]),
      scene(WORLD_ATTIC, [pad("sw-dup", AUTHOR_UPPER)]),
    ], nothingExists));

    expect(results[WORLD_UPPER].unresolved).toBe(1);
  });

  it("prefers a partner in this import over one on an earlier import's scene", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-down", AUTHOR_LOWER)]),
      scene(WORLD_LOWER, [pad("sw-down", AUTHOR_UPPER)]),
      scene(WORLD_ATTIC, [pad("sw-down", AUTHOR_UPPER)], { primary: false }),
    ], nothingExists));

    expect(results[WORLD_UPPER].stairs[0].scene).toBe(WORLD_LOWER);
  });

  it("repairs a scene from an earlier import whose partner arrives in this one", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-down", AUTHOR_LOWER)], { primary: false }),
      scene(WORLD_LOWER, [pad("sw-down", AUTHOR_UPPER)]),
    ], nothingExists));

    expect(results[WORLD_UPPER].stairs[0].scene).toBe(WORLD_LOWER);
    expect(results[WORLD_LOWER].stairs[0].scene).toBe(WORLD_UPPER);
  });

  it("takes the scene a newer export recorded as the author scene", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-unpaired", AUTHOR_ATTIC)]),
      scene(WORLD_ATTIC, [], {
        identity: { bookCode: "tst", contentChunkId: "attic", ddbId: 3, sourceSceneId: AUTHOR_ATTIC },
      }),
    ], nothingExists));

    expect(results[WORLD_UPPER].stairs[0].scene).toBe(WORLD_ATTIC);
  });

  it("follows the export's link to the target's meta identity", () => {
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-unpaired", AUTHOR_ATTIC)], {
        links: { [AUTHOR_ATTIC]: { bookCode: "tst", contentChunkId: "attic", ddbId: 3 } },
      }),
      scene(WORLD_ATTIC, [], {
        identity: { bookCode: "tst", contentChunkId: "attic", ddbId: 3, sourceSceneId: null },
      }),
    ], nothingExists));

    expect(results[WORLD_UPPER].stairs[0].scene).toBe(WORLD_ATTIC);
  });

  it("ignores an export link whose meta identity two scenes share", () => {
    const shared = { bookCode: "tst", contentChunkId: "attic", ddbId: 3, sourceSceneId: null };
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-unpaired", AUTHOR_ATTIC)], {
        links: { [AUTHOR_ATTIC]: { bookCode: "tst", contentChunkId: "attic", ddbId: 3 } },
      }),
      scene(WORLD_ATTIC, [], { identity: shared }),
      scene(WORLD_LOWER, [], { identity: shared }),
    ], nothingExists));

    expect(results[WORLD_UPPER].unresolved).toBe(1);
  });

  it("never falls back to a pad name when the pad's destination is explicit but missing", () => {
    // the upper floor's link names the lower floor, which is not in the world; the attic reuses the pad name
    const link = { bookCode: "tst", contentChunkId: "chunk-lower", ddbId: null, regionId: null, sceneName: "Lower" };
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-down", AUTHOR_LOWER)], { links: { [AUTHOR_LOWER]: link } }),
      scene(WORLD_ATTIC, [pad("sw-down", null)], { identity: { bookCode: "tst", contentChunkId: "chunk-attic", ddbId: null, sourceSceneId: AUTHOR_ATTIC } }),
    ], nothingExists));
    expect(results[WORLD_UPPER].stairs[0].scene).toBe(AUTHOR_LOWER);
    expect(results[WORLD_UPPER].unresolved).toBe(1);
  });

  it("settles an author scene id two world scenes share by the one being imported", () => {
    const lower = { bookCode: "tst", contentChunkId: "chunk-lower", ddbId: null, sourceSceneId: AUTHOR_LOWER };
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-down", AUTHOR_LOWER)]),
      scene(WORLD_LOWER, [pad("sw-up", null)], { identity: lower }),
      scene("worldLowerCopy01", [pad("sw-up", null)], { identity: lower, primary: false }),
    ], nothingExists));
    expect(results[WORLD_UPPER].stairs[0].scene).toBe(WORLD_LOWER);
  });

  it("follows the export link to this import when only an older copy kept the author scene id", () => {
    // the refreshed meta-data gave the lower floor a new author id; the upper floor's export still names the old one
    const results = byScene(relinkStairways([
      scene(WORLD_UPPER, [pad("sw-down", AUTHOR_LOWER)], {
        links: { [AUTHOR_LOWER]: { bookCode: "tst", contentChunkId: "chunk-lower", ddbId: null } },
      }),
      scene(WORLD_LOWER, [], { identity: { bookCode: "tst", contentChunkId: "chunk-lower", ddbId: null, sourceSceneId: "authorLowerNew01" } }),
      scene("worldLowerCopy01", [], {
        primary: false,
        identity: { bookCode: "tst", contentChunkId: "chunk-lower", ddbId: null, sourceSceneId: AUTHOR_LOWER },
      }),
    ], nothingExists));
    expect(results[WORLD_UPPER].stairs[0].scene).toBe(WORLD_LOWER);
  });
});
