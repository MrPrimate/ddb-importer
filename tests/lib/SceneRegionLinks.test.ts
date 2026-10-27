import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { remapCopiedRegionLinks, repairAllRegionLinks, repairSceneRegionLinks, tagRegionCopy } from "../../src/lib/SceneRegionLinks";

// Minimal stand-ins for scenes, regions and behaviours: just the collection lookups the link
// repair reads, plus a behaviour update that records what it was given.
function collection<T extends { id: string }>(docs: T[]) {
  return {
    contents: docs,
    get: (id: string) => docs.find((d) => d.id === id),
    find: (fn: (d: T) => boolean) => docs.find(fn),
  };
}

function behavior(id: string, destinations: string[]) {
  const doc: any = {
    id, name: "Teleport Token", type: "teleportToken",
    system: { destinations },
    toObject: () => ({ system: foundry.utils.deepClone(doc.system) }),
    update: async (data: any) => {
      doc.system = data.system;
    },
  };
  return doc;
}

function region(sceneId: string, id: string, name: string, behaviors: any[], flags: any = {}) {
  return { id, name, flags, uuid: `Scene.${sceneId}.Region.${id}`, behaviors: collection(behaviors) };
}

function scene(id: string, name: string, regions: any[]) {
  return { id, name, regions: collection(regions) } as any;
}

const FLOOR_A = "floorSceneAAAAAA";
const FLOOR_B = "floorSceneBBBBBB";
const MERGED = "mergedScene00001";

describe("repairSceneRegionLinks", () => {
  let world: Record<string, any>;
  let previous: any;
  let previousScenes: any;

  beforeEach(() => {
    // originals on two floor scenes, pointing at each other
    const upA = region(FLOOR_A, "upStairsAAAAAAAA", "Stairs Up", [behavior("behUpAAAAAAAAAAA", [`Scene.${FLOOR_B}.Region.downStairsBBBBBB`])]);
    const downB = region(FLOOR_B, "downStairsBBBBBB", "Stairs Down", [behavior("behDownBBBBBBBBB", [`Scene.${FLOOR_A}.Region.upStairsAAAAAAAA`])]);
    world = {
      [upA.uuid]: upA,
      [downB.uuid]: downB,
    };
    previous = (globalThis as any).fromUuidSync;
    previousScenes = (globalThis as any).game.scenes;
    (globalThis as any).fromUuidSync = (uuid: string) => world[uuid] ?? null;
    (globalThis as any).game.scenes = collection([scene(FLOOR_A, "Floor A", [upA]), scene(FLOOR_B, "Floor B", [downB])]);
  });

  afterEach(() => {
    (globalThis as any).fromUuidSync = previous;
    (globalThis as any).game.scenes = previousScenes;
  });

  it("moves links onto copies found by their copiedFrom tag", async () => {
    const upData: any = {};
    tagRegionCopy(upData, world[`Scene.${FLOOR_A}.Region.upStairsAAAAAAAA`]);
    const downData: any = {};
    tagRegionCopy(downData, world[`Scene.${FLOOR_B}.Region.downStairsBBBBBB`]);
    const upCopy = region(MERGED, "upCopy0000000000", "Stairs Up",
      [behavior("behUpAAAAAAAAAAA", [`Scene.${FLOOR_B}.Region.downStairsBBBBBB`])], upData.flags);
    const downCopy = region(MERGED, "downCopy00000000", "Stairs Down",
      [behavior("behDownBBBBBBBBB", [`Scene.${FLOOR_A}.Region.upStairsAAAAAAAA`])], downData.flags);
    const merged = scene(MERGED, "Merged", [upCopy, downCopy]);

    const rows = await repairSceneRegionLinks(merged, { apply: true, useNames: false });
    expect(rows.map((r) => r.status)).toEqual(["remapped", "remapped"]);
    expect(upCopy.behaviors.contents[0].system.destinations).toEqual([`Scene.${MERGED}.Region.downCopy00000000`]);
    expect(downCopy.behaviors.contents[0].system.destinations).toEqual([`Scene.${MERGED}.Region.upCopy0000000000`]);
  });

  it("falls back to a unique region name for untagged copies, and only reports without apply", async () => {
    const upCopy = region(MERGED, "upCopy0000000000", "Stairs Up",
      [behavior("behUpAAAAAAAAAAA", [`Scene.${FLOOR_B}.Region.downStairsBBBBBB`])]);
    const downCopy = region(MERGED, "downCopy00000000", "Stairs Down",
      [behavior("behDownBBBBBBBBB", [`Scene.${FLOOR_A}.Region.upStairsAAAAAAAA`])]);
    const merged = scene(MERGED, "Merged", [upCopy, downCopy]);

    const rows = await repairSceneRegionLinks(merged, { useNames: true });
    expect(rows.map((r) => [r.status, r.to])).toEqual([
      ["remapped", `Scene.${MERGED}.Region.downCopy00000000`],
      ["remapped", `Scene.${MERGED}.Region.upCopy0000000000`],
    ]);
    expect(upCopy.behaviors.contents[0].system.destinations[0]).toContain(FLOOR_B);
  });

  it("reports live cross-scene links, dangling links and name clashes without changing them", async () => {
    const live = region(MERGED, "liveLink00000000", "Exit",
      [behavior("behLive000000000", [`Scene.${FLOOR_B}.Region.downStairsBBBBBB`])]);
    const dead = region(MERGED, "deadLink00000000", "Gone",
      [behavior("behDead000000000", [`Scene.${FLOOR_B}.Region.missingRegion000`])]);
    const rows = await repairSceneRegionLinks(scene(MERGED, "Merged", [live, dead]), { apply: true });
    expect(rows.map((r) => r.status)).toEqual(["cross-scene", "dangling"]);

    const twinA = region(MERGED, "twinA00000000000", "Stairs Down", []);
    const twinB = region(MERGED, "twinB00000000000", "Stairs Down", []);
    const holder = region(MERGED, "holder0000000000", "Stairs Up",
      [behavior("behHold000000000", [`Scene.${FLOOR_B}.Region.downStairsBBBBBB`])]);
    const clash = await repairSceneRegionLinks(scene(MERGED, "Merged", [twinA, twinB, holder]), { useNames: true });
    expect(clash.map((r) => r.status)).toEqual(["ambiguous"]);
  });

  it("keeps an original's cross-scene link unless names are asked for, and never matches names world-wide", async () => {
    // floor A's own stairs lead down to floor B; floor A also has an arrival pad named like B's stairs,
    // and an untagged copy of floor A's stairs on a merged scene looks just like the original
    const pad = region(FLOOR_A, "padAAAAAAAAAAAAA", "Stairs Down", []);
    const floorA = scene(FLOOR_A, "Floor A", [world[`Scene.${FLOOR_A}.Region.upStairsAAAAAAAA`], pad]);
    const upCopy = region(MERGED, "upCopy0000000000", "Stairs Up",
      [behavior("behUpAAAAAAAAAAA", [`Scene.${FLOOR_B}.Region.downStairsBBBBBB`])]);
    (globalThis as any).game.scenes = collection([
      floorA, scene(FLOOR_B, "Floor B", [world[`Scene.${FLOOR_B}.Region.downStairsBBBBBB`]]), scene(MERGED, "Merged", [upCopy]),
    ]);
    const destinations = () => world[`Scene.${FLOOR_A}.Region.upStairsAAAAAAAA`].behaviors.contents[0].system.destinations;

    const rows = await repairSceneRegionLinks(floorA, { apply: true });
    expect(rows.map((r) => r.status)).toEqual(["cross-scene"]);
    expect(destinations()).toEqual([`Scene.${FLOOR_B}.Region.downStairsBBBBBB`]);

    await repairAllRegionLinks({ apply: true });
    expect(destinations()).toEqual([`Scene.${FLOOR_B}.Region.downStairsBBBBBB`]);
  });

  it("moves a same-scene level copy's links onto its own batch, leaving the originals alone", async () => {
    // a stair pair on level 1 of one scene, copied to level 2 of the same scene (twice: an earlier copy
    // already sits on level 3 with the same copiedFrom tags)
    const SCENE = "oneSceneLevels01";
    const up = region(SCENE, "upOriginal000000", "Stairs Up", [behavior("behUpOrig0000000", [`Scene.${SCENE}.Region.downOriginal0000`])]);
    const down = region(SCENE, "downOriginal0000", "Stairs Down", [behavior("behDnOrig0000000", [`Scene.${SCENE}.Region.upOriginal000000`])]);
    world[up.uuid] = up;
    world[down.uuid] = down;
    const copyOf = (source: any, id: string, links: string[]) => {
      const data: any = {};
      tagRegionCopy(data, source);
      return region(SCENE, id, source.name, [behavior(`${id.slice(0, 8)}Beh00000`, links)], data.flags);
    };
    const oldUp = copyOf(up, "upLevel300000000", [`Scene.${SCENE}.Region.downLevel3000000`]);
    const oldDown = copyOf(down, "downLevel3000000", [`Scene.${SCENE}.Region.upLevel300000000`]);
    const newUp = copyOf(up, "upLevel200000000", [`Scene.${SCENE}.Region.downOriginal0000`]);
    const newDown = copyOf(down, "downLevel2000000", [`Scene.${SCENE}.Region.upOriginal000000`]);
    const one = scene(SCENE, "One Scene", [up, down, oldUp, oldDown, newUp, newDown]);

    expect(await remapCopiedRegionLinks(one, [newUp, newDown] as any)).toBe(2);
    expect(newUp.behaviors.contents[0].system.destinations).toEqual([`Scene.${SCENE}.Region.downLevel2000000`]);
    expect(newDown.behaviors.contents[0].system.destinations).toEqual([`Scene.${SCENE}.Region.upLevel200000000`]);
    expect(up.behaviors.contents[0].system.destinations).toEqual([`Scene.${SCENE}.Region.downOriginal0000`]);
    expect(oldUp.behaviors.contents[0].system.destinations).toEqual([`Scene.${SCENE}.Region.downLevel3000000`]);
  });
});
