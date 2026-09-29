// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { scanForScenes } from "../../../src/muncher/adventure/native/NativeSceneParser";
import { resolveSceneId } from "../../../src/muncher/adventure/native/NativeSceneBuilder";
import NativeIdFactory from "../../../src/muncher/adventure/native/NativeIdFactory";

// Synthetic book row: two figures without caption chunk ids (the common DDB
// shape), one with a player link and one gridless map.
function row(sourceHtml: string): ProcessedRow {
  return {
    id: 53,
    cobaltId: null,
    parentId: 357,
    slug: "chapter-x#AreaA",
    title: "Chapter X",
    contentChunkId: "row-chunk",
    content: "",
    sourceHtml,
    level: 1,
  } as ProcessedRow;
}

const FIGURES = `
  <figure id="MapA1TestKeep">
    <img src="ddb://image/tst/map-a1-dm.jpg">
    <figcaption>Map A.1: Test Keep <a href="ddb://image/tst/map-a1-player.jpg" data-title="Player Version">View Player Version</a></figcaption>
  </figure>
  <figure id="MapA2TestCellar">
    <img src="ddb://image/tst/map-a2.jpg">
    <figcaption>Map A.2: Test Cellar <a href="ddb://image/tst/map-a2-ungridded.jpg" data-title="Without Grid">Without Grid</a></figcaption>
  </figure>
  <figure id="MapA3Chunked">
    <img src="ddb://image/tst/map-a3.jpg">
    <figcaption data-content-chunk-id="real-chunk-id">Map A.3 <a href="ddb://image/tst/map-a3-player.jpg" data-title="Player Version">View Player Version</a></figcaption>
  </figure>`;

describe("scanForScenes figure contentChunkIds", () => {
  const scenes = scanForScenes(row(FIGURES), "tst");

  it("uses the zip muncher's <figure id>-<version type> form", () => {
    expect(scenes.map((s) => s.contentChunkId)).toEqual([
      "MapA1TestKeep-player",
      "MapA2TestCellar-ungridded",
      "real-chunk-id",
    ]);
  });

  it("keeps the earlier native <figure id>-<count> form to find old scenes", () => {
    expect(scenes.map((s) => s.legacyContentChunkId)).toEqual([
      "MapA1TestKeep-1",
      "MapA2TestCellar-3",
      undefined,
    ]);
  });
});

describe("resolveSceneId", () => {
  const originalScenes = (globalThis as any).game.scenes;
  afterEach(() => {
    (globalThis as any).game.scenes = originalScenes;
  });

  const detection: DetectedScene = {
    name: "Map A.1: Test Keep (Player Version)",
    imagePath: "assets/map-a1-player.jpg",
    contentChunkId: "MapA1TestKeep-player",
    legacyContentChunkId: "MapA1TestKeep-1",
    isPlayer: true,
    source: "figure",
    syntheticIdOffset: 10054,
  };
  const sceneRow = row("");

  function idFor(contentChunkId: string): string {
    return new NativeIdFactory().getId(NativeIdFactory.makeKey({
      docType: "Scene",
      ddbId: detection.syntheticIdOffset,
      cobaltId: sceneRow.cobaltId,
      parentId: sceneRow.parentId,
      contentChunkId,
      name: detection.name,
    }));
  }

  function worldWith(ids: string[]) {
    (globalThis as any).game.scenes = { get: (id: string) => (ids.includes(id) ? { id } : undefined) };
  }

  it("uses the current id for a fresh import", () => {
    worldWith([]);
    expect(resolveSceneId(new NativeIdFactory(), detection, sceneRow)).toBe(idFor("MapA1TestKeep-player"));
  });

  it("reuses a scene an earlier native import created under the legacy id", () => {
    worldWith([idFor("MapA1TestKeep-1")]);
    expect(resolveSceneId(new NativeIdFactory(), detection, sceneRow)).toBe(idFor("MapA1TestKeep-1"));
  });

  it("prefers the current id when both exist", () => {
    worldWith([idFor("MapA1TestKeep-1"), idFor("MapA1TestKeep-player")]);
    expect(resolveSceneId(new NativeIdFactory(), detection, sceneRow)).toBe(idFor("MapA1TestKeep-player"));
  });

  it("uses the current id when there is no legacy form", () => {
    worldWith([]);
    const chunked = { ...detection, contentChunkId: "real-chunk-id", legacyContentChunkId: undefined };
    expect(resolveSceneId(new NativeIdFactory(), chunked, sceneRow)).toBe(idFor("real-chunk-id"));
  });
});
