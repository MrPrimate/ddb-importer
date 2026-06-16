import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSceneGridImageSource } from "../../src/apps/SceneGridDetector";

function level(id: string, src?: string | null, name?: string) {
  return {
    _id: id,
    id,
    name,
    background: { src },
  };
}

function setCanvas(sceneId: string | null, levelId: string | null) {
  vi.stubGlobal("canvas", {
    scene: sceneId ? { id: sceneId } : null,
    level: levelId ? { id: levelId } : null,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveSceneGridImageSource", () => {
  it("uses canvas.level when canvas.scene matches the scene", () => {
    setCanvas("scene-1", "upper");
    const scene = {
      id: "scene-1",
      initialLevel: "base",
      background: { src: "base-scene.png" },
      levels: [
        level("base", "base-level.png", "Base"),
        level("upper", "upper-level.png", "Upper"),
      ],
    } as any;

    expect(resolveSceneGridImageSource(scene)).toEqual({
      src: "upper-level.png",
      levelId: "upper",
      levelName: "Upper",
      source: "canvas-level",
    });
  });

  it("ignores canvas.level when canvas.scene does not match", () => {
    setCanvas("other-scene", "upper");
    const scene = {
      id: "scene-1",
      initialLevel: "base",
      levels: [
        level("base", "base-level.png", "Base"),
        level("upper", "upper-level.png", "Upper"),
      ],
    } as any;

    expect(resolveSceneGridImageSource(scene)).toEqual({
      src: "base-level.png",
      levelId: "base",
      levelName: "Base",
      source: "initial-level",
    });
  });

  it("falls back to scene.initialLevel when no matching canvas level exists", () => {
    setCanvas(null, null);
    const scene = {
      id: "scene-1",
      initialLevel: "upper",
      levels: [
        level("base", "base-level.png", "Base"),
        level("upper", "upper-level.png", "Upper"),
      ],
    } as any;

    const source = resolveSceneGridImageSource(scene);
    expect(source?.src).toBe("upper-level.png");
    expect(source?.source).toBe("initial-level");
  });

  it("falls back to the first level with a background src", () => {
    const scene = {
      id: "scene-1",
      levels: [
        level("blank", "", "Blank"),
        level("missing", null, "Missing"),
        level("usable", "usable-level.png", "Usable"),
      ],
    } as any;

    expect(resolveSceneGridImageSource(scene)).toEqual({
      src: "usable-level.png",
      levelId: "usable",
      levelName: "Usable",
      source: "first-level",
    });
  });

  it("falls back to legacy scene.background.src when no level image exists", () => {
    const scene = {
      id: "scene-1",
      background: { src: "legacy-background.png" },
      levels: [level("blank", "", "Blank")],
    } as any;

    expect(resolveSceneGridImageSource(scene)).toEqual({
      src: "legacy-background.png",
      levelId: null,
      levelName: null,
      source: "scene-background",
    });
  });

  it("returns null when no usable image exists", () => {
    const scene = {
      id: "scene-1",
      background: { src: "" },
      levels: [level("blank", "", "Blank")],
    } as any;

    expect(resolveSceneGridImageSource(scene)).toBeNull();
  });

  it("supports collection-like levels with get and contents", () => {
    setCanvas("scene-1", "upper");
    const base = level("base", "base-level.png", "Base");
    const upper = level("upper", "upper-level.png", "Upper");
    const scene = {
      id: "scene-1",
      initialLevel: "base",
      levels: {
        contents: [base, upper],
        get: vi.fn((id: string) => (id === "upper" ? upper : id === "base" ? base : null)),
      },
    } as any;

    expect(resolveSceneGridImageSource(scene)?.src).toBe("upper-level.png");
    expect(scene.levels.get).toHaveBeenCalledWith("upper");
  });

  it("supports iterable level collections", () => {
    const levels = new Map<string, any>([
      ["base", level("base", "", "Base")],
      ["upper", level("upper", "upper-level.png", "Upper")],
    ]);
    const scene = {
      id: "scene-1",
      levels,
    } as any;

    expect(resolveSceneGridImageSource(scene)).toEqual({
      src: "upper-level.png",
      levelId: "upper",
      levelName: "Upper",
      source: "first-level",
    });
  });
});
