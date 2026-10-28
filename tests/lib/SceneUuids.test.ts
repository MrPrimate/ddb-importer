import { describe, it, expect } from "vitest";
import { absolutizeSceneUuids, parseSceneUuid, resolveRelativeUuid, walkSceneUuids } from "../../src/lib/SceneUuids";

// A teleport behaviour's own UUID: the origin Foundry 14 reads its relative destinations against.
const ORIGIN = "Scene.sceneAAAAAAAAAAA.Region.regionAAAAAAAAAA.RegionBehavior.behaviorAAAAAAAA";

describe("resolveRelativeUuid", () => {
  it("reads the forms Foundry's buildRelativeUuid writes for region behaviours", () => {
    // a region on the same scene, as the published meta-data stores teleport destinations
    expect(resolveRelativeUuid("..regionBBBBBBBBBB", ORIGIN)).toBe("Scene.sceneAAAAAAAAAAA.Region.regionBBBBBBBBBB");
    // a behaviour of the same region, and of another region on the scene
    expect(resolveRelativeUuid(".behaviorBBBBBBBB", ORIGIN))
      .toBe("Scene.sceneAAAAAAAAAAA.Region.regionAAAAAAAAAA.RegionBehavior.behaviorBBBBBBBB");
    expect(resolveRelativeUuid("..regionBBBBBBBBBB.RegionBehavior.behaviorBBBBBBBB", ORIGIN))
      .toBe("Scene.sceneAAAAAAAAAAA.Region.regionBBBBBBBBBB.RegionBehavior.behaviorBBBBBBBB");
    // a child of the region, by explicit type
    expect(resolveRelativeUuid("..RegionBehavior.behaviorBBBBBBBB", ORIGIN))
      .toBe("Scene.sceneAAAAAAAAAAA.Region.regionAAAAAAAAAA.RegionBehavior.behaviorBBBBBBBB");
    // a region on another scene
    expect(resolveRelativeUuid("...sceneBBBBBBBBBBB.Region.regionBBBBBBBBBB", ORIGIN))
      .toBe("Scene.sceneBBBBBBBBBBB.Region.regionBBBBBBBBBB");
  });

  it("rejects absolute UUIDs and dots past the root", () => {
    expect(resolveRelativeUuid("Scene.sceneAAAAAAAAAAA.Region.regionBBBBBBBBBB", ORIGIN)).toBeNull();
    expect(resolveRelativeUuid(".....regionBBBBBBBBBB", ORIGIN)).toBeNull();
  });
});

describe("walkSceneUuids with an origin", () => {
  it("hands relative UUIDs over in absolute form and keeps them as written when unchanged", () => {
    const system = { destinations: ["..regionBBBBBBBBBB", "Scene.sceneBBBBBBBBBBB.Region.regionCCCCCCCCCC"] };
    const seen: string[] = [];
    walkSceneUuids(system, (uuid) => {
      seen.push(uuid);
      return uuid;
    }, { origin: ORIGIN });
    expect(seen).toEqual([
      "Scene.sceneAAAAAAAAAAA.Region.regionBBBBBBBBBB",
      "Scene.sceneBBBBBBBBBBB.Region.regionCCCCCCCCCC",
    ]);
    expect(system.destinations[0]).toBe("..regionBBBBBBBBBB");
    expect(parseSceneUuid("..regionBBBBBBBBBB")).toBeNull();
  });

  it("absolutizes relative UUIDs for a copy", () => {
    const system = { destinations: ["..regionBBBBBBBBBB"], enable: [".behaviorBBBBBBBB"] };
    absolutizeSceneUuids(system, ORIGIN);
    expect(system).toEqual({
      destinations: ["Scene.sceneAAAAAAAAAAA.Region.regionBBBBBBBBBB"],
      enable: ["Scene.sceneAAAAAAAAAAA.Region.regionAAAAAAAAAA.RegionBehavior.behaviorBBBBBBBB"],
    });
  });
});
