import { describe, it, expect } from "vitest";
import AdventureMunch, { DEFAULT_LEVEL_ID } from "../../../src/muncher/adventure/AdventureMunch";

// Regression: levels-aware meta scenes that still carry the image in the
// deprecated top-level `background` block. _migrateSceneDataToV14 must move the
// src into the default level (V14 renders from levels[0].background.src), carry
// the offset to shiftX/Y, and strip the deprecated fields.
describe("AdventureMunch._migrateSceneDataToV14 - levels-present reconciliation", () => {
  const strayBackgroundScene = () => ({
    name: "Map: Terror In Tepest",
    backgroundColor: "#999999",
    background: {
      offsetX: 19,
      offsetY: 19,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      tint: null,
      src: "assets/map-02-001.terror-in-tepest.jpg",
    },
    levels: [
      {
        _id: DEFAULT_LEVEL_ID,
        name: "Level",
        background: { color: "#4d4d31", tint: "#ffffff", alphaThreshold: 0.75 },
        textures: { anchorX: 0.5, anchorY: 0.5, fit: "fill" },
      },
    ],
  });

  it("transfers the stray background src into the default level image", () => {
    const result = AdventureMunch._migrateSceneDataToV14(strayBackgroundScene());
    expect(result.levels[0].background.src).toBe("assets/map-02-001.terror-in-tepest.jpg");
  });

  it("maps background.offsetX/Y to root shiftX/Y", () => {
    const result = AdventureMunch._migrateSceneDataToV14(strayBackgroundScene());
    expect(result.shiftX).toBe(19);
    expect(result.shiftY).toBe(19);
  });

  it("strips the deprecated top-level background fields", () => {
    const result = AdventureMunch._migrateSceneDataToV14(strayBackgroundScene());
    expect(result.background).toBeUndefined();
    expect(result.backgroundColor).toBeUndefined();
  });

  it("does not clobber a level that already carries its own image / colour", () => {
    const data = strayBackgroundScene();
    data.levels[0].background.src = "assets/already-set.jpg";
    const result = AdventureMunch._migrateSceneDataToV14(data);
    expect(result.levels[0].background.src).toBe("assets/already-set.jpg");
    // existing level colour is preserved (top-level colour does not override it)
    expect(result.levels[0].background.color).toBe("#4d4d31");
  });

  it("leaves a clean native-built doc (level src set, no top-level background) untouched", () => {
    const clean: any = {
      name: "Native",
      shiftX: 0,
      shiftY: 0,
      levels: [
        {
          _id: DEFAULT_LEVEL_ID,
          name: "Level",
          background: { src: "assets/native.jpg", color: "#123456", tint: "#ffffff" },
        },
      ],
    };
    const result = AdventureMunch._migrateSceneDataToV14(clean);
    expect(result.levels[0].background.src).toBe("assets/native.jpg");
    expect(result.shiftX).toBe(0);
    expect(result.shiftY).toBe(0);
    expect(result.background).toBeUndefined();
  });
});
