import { describe, it, expect } from "vitest";
import { drawingHasVisibleContent, perfectVisionDrawingToRegion } from "../../../src/muncher/adventure/MetaRegions";

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
