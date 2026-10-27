import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { collectSceneLinks, exportSceneDdbId } from "../../src/apps/SceneEnhancerExport";

const HERE = "exportScene00001";
const THERE = "targetScene00001";
const NO_IDS = "plainScene000001";

function teleport(name: string, destinations: string[]) {
  return {
    _id: `${name.padEnd(16, "0").slice(0, 16)}`,
    name,
    behaviors: [{ _id: "behavior00000001", name: "Teleport Token", type: "teleportToken", system: { destinations } }],
    flags: {},
  };
}

describe("collectSceneLinks", () => {
  let previous: { game: any; fromUuidSync: any };

  beforeEach(() => {
    previous = { game: (globalThis as any).game, fromUuidSync: (globalThis as any).fromUuidSync };
    const scenes = new Map<string, any>([
      [THERE, { id: THERE, name: "Upper Floor", flags: { ddb: { bookCode: "tst", ddbId: 7, contentChunkId: "upper" } } }],
      [NO_IDS, { id: NO_IDS, name: "Homebrew", flags: {} }],
    ]);
    (globalThis as any).game = { ...previous.game, scenes };
    const live = new Set([
      `Scene.${HERE}.Region.localRegion00001`,
      `Scene.${THERE}.Region.upperStairs00001`,
      `Scene.${NO_IDS}.Region.homebrewRegion01`,
    ]);
    (globalThis as any).fromUuidSync = (uuid: string) => (live.has(uuid) ? { uuid } : null);
  });

  afterEach(() => {
    (globalThis as any).game = previous.game;
    (globalThis as any).fromUuidSync = previous.fromUuidSync;
  });

  it("records cross-scene targets by DDB ids and lists links that cannot be followed", () => {
    const scene: any = {
      id: HERE,
      name: "Ground Floor",
      flags: { stairways: { data: [{ name: "Up", scene: THERE }, { name: "Gone", scene: "missingScene0001" }] } },
      _source: {
        regions: [
          teleport("Local", [`Scene.${HERE}.Region.localRegion00001`]),
          teleport("Upstairs", [`Scene.${THERE}.Region.upperStairs00001`]),
          teleport("Homebrew", [`Scene.${NO_IDS}.Region.homebrewRegion01`]),
          teleport("Dead", [`Scene.${HERE}.Region.deadRegion000001`]),
          // placed during play: never exported, so never checked
          { ...teleport("Moonbeam", [`Scene.${HERE}.Region.deadRegion000002`]), flags: { dnd5e: { activity: "x" } } },
        ],
      },
    };
    const { links, problems } = collectSceneLinks(scene);
    expect(links).toEqual({
      [`Scene.${THERE}.Region.upperStairs00001`]: {
        bookCode: "tst", contentChunkId: "upper", ddbId: 7, regionId: "upperStairs00001", sceneName: "Upper Floor",
      },
      [THERE]: { bookCode: "tst", contentChunkId: "upper", ddbId: 7, regionId: null, sceneName: "Upper Floor" },
    });
    expect(problems).toHaveLength(3);
    expect(problems[0]).toContain("Homebrew / Teleport Token");
    expect(problems[0]).toContain("no DDB ids");
    expect(problems[1]).toContain("deadRegion000001 does not exist");
    expect(problems[2]).toContain("Stairway \"Gone\"");
  });

  it("keeps a destination the import parked, with the link it arrived with", () => {
    const parkedUuid = "Scene.authorScene00002.Region.neverPlaced00001";
    const link: IMetaRegionLink = { bookCode: "tst", contentChunkId: "cellar", ddbId: 9, regionId: "neverPlaced00001", sceneName: "Cellar" };
    const parked = teleport("Downstairs", []) as any;
    parked.behaviors[0].disabled = true;
    parked.behaviors[0].flags = { ddbimporter: {
      disabledUnresolved: true,
      unresolvedUuids: [{ path: "destinations", uuid: parkedUuid, array: true, link }],
    } };
    const scene: any = { id: HERE, name: "Ground Floor", flags: {}, _source: { regions: [parked] } };
    const { links, problems } = collectSceneLinks(scene);
    expect(links).toEqual({ [parkedUuid]: link });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("never placed");
    // the scene's own data is not changed by the export
    expect(parked.behaviors[0].system.destinations).toEqual([]);
  });
});

describe("exportSceneDdbId", () => {
  const nativeFlags = { ddb: { ddbId: 42, contentChunkId: "Map212LekarGate-player", source: "figure" } };

  it("keeps the id of a muncher scene and of a native scene that already follows the muncher", () => {
    expect(exportSceneDdbId({ flags: { ddb: { ddbId: 10043, contentChunkId: "x" } } } as any).ddbId).toBe(10043);
    expect(exportSceneDdbId({ flags: { ddb: { ddbId: 10043, rowId: 42, source: "figure" } } } as any).ddbId).toBe(10043);
    // missing scenes already carry the muncher's 90000-based id
    expect(exportSceneDdbId({ flags: { ddb: { ddbId: 90012, source: "missing" } } } as any).ddbId).toBe(90012);
  });

  it("takes an older native scene's id from the meta-data file it was enriched from", () => {
    const scene: any = {
      sort: 1, flags: { ...nativeFlags, ddbimporter: { metaSource: { contentChunkId: "Map212LekarGate-player", ddbId: 10043 } } },
    };
    expect(exportSceneDdbId(scene)).toEqual({ ddbId: 10043 });
  });

  it("recovers it from the native sort, and reports a scene it cannot place", () => {
    expect(exportSceneDdbId({ sort: 100000 + 42 + 10043, flags: nativeFlags } as any)).toEqual({ ddbId: 10043 });
    const moved = exportSceneDdbId({ name: "Lekar Gate", sort: 500, flags: nativeFlags } as any);
    expect(moved.ddbId).toBe(42);
    expect(moved.problem).toContain("re-import");
  });
});
