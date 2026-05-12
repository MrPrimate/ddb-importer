import { describe, it, expect, vi } from "vitest";
import { isGridDetectionCandidate } from "../../../src/muncher/adventure/GridDetectionCandidate";

function makeDims(width: number, height: number) {
  return vi.fn(async () => ({ width, height }));
}

describe("isGridDetectionCandidate", () => {
  it("returns true when image dims match scene dims and shift is zero", async () => {
    const scene = {
      background: { src: "scene.png" },
      shiftX: 0,
      shiftY: 0,
      width: 2000,
      height: 1500,
    };
    const ok = await isGridDetectionCandidate(scene, makeDims(2000, 1500));
    expect(ok).toBe(true);
  });

  it("returns true when shift fields are missing (treated as zero)", async () => {
    const scene = {
      background: { src: "scene.png" },
      width: 2000,
      height: 1500,
    };
    const ok = await isGridDetectionCandidate(scene, makeDims(2000, 1500));
    expect(ok).toBe(true);
  });

  it("falls back to levels[0].background.src when top-level src is missing", async () => {
    const scene = {
      levels: [{ background: { src: "level.png" } }],
      width: 2000,
      height: 1500,
    };
    const getDims = makeDims(2000, 1500);
    const ok = await isGridDetectionCandidate(scene, getDims);
    expect(ok).toBe(true);
    expect(getDims).toHaveBeenCalledWith("level.png");
  });

  it("returns false when image dims differ from scene dims", async () => {
    const scene = {
      background: { src: "scene.png" },
      width: 2000,
      height: 1500,
    };
    const ok = await isGridDetectionCandidate(scene, makeDims(2048, 1536));
    expect(ok).toBe(false);
  });

  it("tolerates a 1px rounding difference", async () => {
    const scene = {
      background: { src: "scene.png" },
      width: 2000,
      height: 1500,
    };
    const ok = await isGridDetectionCandidate(scene, makeDims(2001, 1499));
    expect(ok).toBe(true);
  });

  it("returns false when shiftX is non-zero", async () => {
    const scene = {
      background: { src: "scene.png" },
      shiftX: 12,
      shiftY: 0,
      width: 2000,
      height: 1500,
    };
    const ok = await isGridDetectionCandidate(scene, makeDims(2000, 1500));
    expect(ok).toBe(false);
  });

  it("returns false when shiftY is non-zero", async () => {
    const scene = {
      background: { src: "scene.png" },
      shiftX: 0,
      shiftY: -5,
      width: 2000,
      height: 1500,
    };
    const ok = await isGridDetectionCandidate(scene, makeDims(2000, 1500));
    expect(ok).toBe(false);
  });

  it("returns false when scene has no background src", async () => {
    const scene = {
      width: 2000,
      height: 1500,
    };
    const getDims = makeDims(2000, 1500);
    const ok = await isGridDetectionCandidate(scene, getDims);
    expect(ok).toBe(false);
    expect(getDims).not.toHaveBeenCalled();
  });

  it("returns false when scene dims are not finite numbers", async () => {
    const scene = {
      background: { src: "scene.png" },
      width: null,
      height: undefined,
    };
    const ok = await isGridDetectionCandidate(scene, makeDims(2000, 1500));
    expect(ok).toBe(false);
  });

  it("returns false (and swallows error) when image fetch throws", async () => {
    const scene = {
      background: { src: "scene.png" },
      width: 2000,
      height: 1500,
    };
    const getDims = vi.fn(async () => { throw new Error("network down"); });
    const ok = await isGridDetectionCandidate(scene, getDims);
    expect(ok).toBe(false);
  });
});
