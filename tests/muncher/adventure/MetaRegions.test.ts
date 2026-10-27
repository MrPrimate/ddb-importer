import { describe, it, expect } from "vitest";
import {
  buildMetaRegionIndex,
  drawingHasVisibleContent,
  metaIndexEntry,
  parseSceneUuid,
  perfectVisionDrawingToRegion,
  prepareMetaRegion,
  relinkRegionBehaviors,
  resolveMetaUuid,
} from "../../../src/muncher/adventure/MetaRegions";

const AUTHOR_SCENE = "authorScene00001";
const OTHER_AUTHOR_SCENE = "authorScene00002";
const WORLD_SCENE = "worldScene000001";
const OTHER_WORLD_SCENE = "worldScene000002";

const identity = (over: Partial<IMetaSceneIdentity> = {}): IMetaSceneIdentity => ({
  bookCode: "tst", contentChunkId: "chunk-a", ddbId: 1, sourceSceneId: null, ...over,
});

function teleportRegion(id: string, destinations: string[], extra: Record<string, any> = {}) {
  return {
    _id: id,
    name: `Stairs ${id}`,
    shapes: [{ type: "rectangle", x: 0, y: 0, width: 100, height: 100, rotation: 0, hole: false }],
    levels: ["defaultLevel0000"],
    ownership: { default: 0 },
    _shapeConstraints: [[0, 0]],
    _stats: { coreVersion: "14.364" },
    behaviors: [{
      _id: `beh${id.slice(3)}`,
      name: "Teleport Token",
      type: "teleportToken",
      system: { choice: true, destinations },
      disabled: false,
      _stats: { coreVersion: "14.364" },
    }],
    flags: {},
    ...extra,
  };
}

describe("parseSceneUuid", () => {
  it("reads region and behaviour UUIDs and rejects relative or non-scene ones", () => {
    expect(parseSceneUuid(`Scene.${AUTHOR_SCENE}.Region.regionAAAAAAAAAA`)).toEqual({
      sceneId: AUTHOR_SCENE, type: "Region", id: "regionAAAAAAAAAA", behaviorId: null,
    });
    expect(parseSceneUuid(`Scene.${AUTHOR_SCENE}.Region.regionAAAAAAAAAA.RegionBehavior.behaviorAAAAAAAA`)?.behaviorId)
      .toBe("behaviorAAAAAAAA");
    expect(parseSceneUuid(".RegionBehavior.behaviorAAAAAAAA")).toBeNull();
    expect(parseSceneUuid("Compendium.dnd5e.items.Item.abcdefghijklmnop")).toBeNull();
  });
});

describe("prepareMetaRegion", () => {
  const regions = [
    teleportRegion("regionAAAAAAAAAA", [`Scene.${AUTHOR_SCENE}.Region.regionBBBBBBBBBB`]),
    teleportRegion("regionBBBBBBBBBB", [`Scene.${AUTHOR_SCENE}.Region.regionAAAAAAAAAA`]),
    teleportRegion("regionCCCCCCCCCC", [`Scene.${OTHER_AUTHOR_SCENE}.Region.regionZZZZZZZZZZ`]),
  ];
  const index = buildMetaRegionIndex([metaIndexEntry(WORLD_SCENE, regions, identity())]);
  const resolve = (uuid: string) => resolveMetaUuid(uuid, index);

  it("re-points same-file destinations to the world scene and strips author internals", () => {
    const { data, unresolved } = prepareMetaRegion(regions[0], { levelIds: new Set(["defaultLevel0000"]), resolve });
    expect(unresolved).toBe(0);
    expect(data.behaviors[0].system.destinations).toEqual([`Scene.${WORLD_SCENE}.Region.regionBBBBBBBBBB`]);
    expect(data.behaviors[0].disabled).toBe(false);
    expect(data._id).toBe("regionAAAAAAAAAA");
    expect(data._stats).toBeUndefined();
    expect(data.ownership).toBeUndefined();
    expect(data._shapeConstraints).toBeUndefined();
    expect(data.behaviors[0]._stats).toBeUndefined();
    expect(data.flags.ddbimporter.source).toBe("meta-data");
    // the source data is not modified
    expect(regions[0].behaviors[0].system.destinations[0]).toContain(AUTHOR_SCENE);
  });

  it("keeps only level ids the scene has", () => {
    const { data } = prepareMetaRegion(regions[0], { levelIds: new Set(["otherLevel000000"]), resolve });
    expect(data.levels).toEqual([]);
  });

  it("parks a destination in another scene and disables the empty teleport", () => {
    const link: IMetaRegionLink = { bookCode: "tst", contentChunkId: "chunk-b", regionId: "regionZZZZZZZZZZ" };
    const uuid = `Scene.${OTHER_AUTHOR_SCENE}.Region.regionZZZZZZZZZZ`;
    const { data, unresolved } = prepareMetaRegion(regions[2], {
      levelIds: new Set(["defaultLevel0000"]), resolve, links: { [uuid]: link },
    });
    expect(unresolved).toBe(1);
    const behavior = data.behaviors[0];
    expect(behavior.system.destinations).toEqual([]);
    expect(behavior.disabled).toBe(true);
    expect(behavior.flags.ddbimporter.disabledUnresolved).toBe(true);
    expect(behavior.flags.ddbimporter.unresolvedUuids).toEqual([{ path: "destinations", uuid, array: true, link }]);
  });

  it("trusts the recorded source scene id over a region id match", () => {
    const sourced = buildMetaRegionIndex([metaIndexEntry(WORLD_SCENE, regions, identity({ sourceSceneId: AUTHOR_SCENE }))]);
    expect(resolveMetaUuid(`Scene.${AUTHOR_SCENE}.Region.regionBBBBBBBBBB`, sourced))
      .toBe(`Scene.${WORLD_SCENE}.Region.regionBBBBBBBBBB`);
    expect(resolveMetaUuid(`Scene.${AUTHOR_SCENE}.Region.regionMISSINGXXXX`, sourced)).toBeNull();
  });
});

describe("relinkRegionBehaviors", () => {
  it("re-points a parked destination through an export link and re-enables the teleport", () => {
    const uuid = `Scene.${OTHER_AUTHOR_SCENE}.Region.regionZZZZZZZZZZ`;
    const behaviors = [{
      _id: "behaviorAAAAAAAA",
      type: "teleportToken",
      disabled: true,
      system: { destinations: [] },
      flags: { ddbimporter: {
        disabledUnresolved: true,
        unresolvedUuids: [{ path: "destinations", uuid, array: true, link: { bookCode: "tst", contentChunkId: "chunk-b" } }],
      } },
    }];
    const index = buildMetaRegionIndex([
      metaIndexEntry(WORLD_SCENE, [], identity()),
      metaIndexEntry(OTHER_WORLD_SCENE, [{ _id: "regionZZZZZZZZZZ", behaviors: [] }], identity({ contentChunkId: "chunk-b", ddbId: 2 })),
    ]);
    const { updates, remaining } = relinkRegionBehaviors(behaviors, index);
    expect(remaining).toBe(0);
    expect(updates).toEqual([{
      _id: "behaviorAAAAAAAA",
      system: { destinations: [`Scene.${OTHER_WORLD_SCENE}.Region.regionZZZZZZZZZZ`] },
      "flags.ddbimporter.unresolvedUuids": [],
      disabled: false,
      "flags.ddbimporter.disabledUnresolved": false,
    }]);
  });

  it("leaves a behaviour alone when nothing resolves", () => {
    const behaviors = [{
      _id: "behaviorAAAAAAAA",
      system: { destinations: [] },
      flags: { ddbimporter: { unresolvedUuids: [{ path: "destinations", uuid: `Scene.${OTHER_AUTHOR_SCENE}.Region.regionYYYYYYYYYY`, array: true }] } },
    }];
    const index = buildMetaRegionIndex([metaIndexEntry(WORLD_SCENE, [], identity())]);
    expect(relinkRegionBehaviors(behaviors, index)).toEqual({ updates: [], remaining: 1 });
  });
});

describe("drawingHasVisibleContent", () => {
  const base = { text: "", textAlpha: 1, fillType: 0, fillAlpha: 0.5, strokeWidth: 8, strokeAlpha: 1 };

  it("rejects the degenerate shapes Foundry 14 refuses", () => {
    // a zero-height rectangle and a two-point polygon, as found in meta-data exports
    expect(drawingHasVisibleContent({ ...base, shape: { type: "r", width: 64, height: 0, points: [] } })).toBe(false);
    expect(drawingHasVisibleContent({ ...base, shape: { type: "p", width: 0, height: 0, points: [10, 10] } })).toBe(false);
  });

  it("rejects an outline-free, fill-free drawing and keeps a stroked one", () => {
    const shape = { type: "p", width: 100, height: 100, points: [0, 0, 100, 0, 100, 100] };
    expect(drawingHasVisibleContent({ ...base, strokeWidth: 0, strokeAlpha: 0, shape })).toBe(false);
    expect(drawingHasVisibleContent({ ...base, shape })).toBe(true);
    expect(drawingHasVisibleContent({ ...base, strokeAlpha: 0, text: "Label", shape })).toBe(true);
  });
});

describe("perfectVisionDrawingToRegion", () => {
  const pv = (darkness: number) => ({ "perfect-vision": { active: true, parent: "", origin: { x: 0.5, y: 0.5 }, darkness } });

  it("turns a darkness polygon into an absolute polygon region with an override behaviour", () => {
    const region = perfectVisionDrawingToRegion({
      x: 1000, y: 2000, rotation: 0, flags: pv(1),
      shape: { type: "p", width: 100, height: 50, points: [0, 0, 100, 0, 100, 50, 0, 50] },
    }, ["defaultLevel0000"]);
    expect(region.shapes).toEqual([{ type: "polygon", points: [1000, 2000, 1100, 2000, 1100, 2050, 1000, 2050], hole: false }]);
    expect(region.levels).toEqual(["defaultLevel0000"]);
    expect(region.behaviors).toEqual([{
      name: "Adjust Darkness Level", type: "adjustDarknessLevel", system: { mode: 0, modifier: 1 }, disabled: false,
    }]);
    expect(region.flags.ddbimporter).toEqual({ source: "meta-data", convertedFrom: "perfect-vision" });
  });

  it("places rectangles and ellipses, rotating a rectangle about its centre", () => {
    const rect = perfectVisionDrawingToRegion({ x: 10, y: 20, flags: pv(0), shape: { type: "r", width: 30, height: 40 } }, []);
    expect(rect.shapes[0]).toEqual({ type: "rectangle", x: 10, y: 20, width: 30, height: 40, rotation: 0, hole: false });
    expect(rect.behaviors[0].system.modifier).toBe(0);

    const ellipse = perfectVisionDrawingToRegion({ x: 0, y: 0, flags: pv(1), shape: { type: "e", width: 40, height: 20 } }, []);
    expect(ellipse.shapes[0]).toMatchObject({ type: "ellipse", x: 20, y: 10, radiusX: 20, radiusY: 10 });

    const rotated = perfectVisionDrawingToRegion({ x: 0, y: 0, rotation: 90, flags: pv(1), shape: { type: "r", width: 20, height: 10 } }, []);
    expect(rotated.shapes[0].type).toBe("polygon");
    const pts = rotated.shapes[0].points.map((n: number) => Math.round(n));
    // a 20x10 box about (10, 5) turned a quarter becomes 10x20 about the same centre
    expect(pts).toEqual([15, -5, 15, 15, 5, 15, 5, -5]);
  });

  it("ignores drawings that are not Perfect Vision darkness areas", () => {
    expect(perfectVisionDrawingToRegion({ x: 0, y: 0, flags: {}, shape: { type: "r", width: 10, height: 10 } }, [])).toBeNull();
    expect(perfectVisionDrawingToRegion({
      x: 0, y: 0, flags: { "perfect-vision": { active: true } }, shape: { type: "r", width: 10, height: 10 },
    }, [])).toBeNull();
  });
});
