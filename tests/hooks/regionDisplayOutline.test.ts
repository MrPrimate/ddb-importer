// @vitest-environment jsdom
import {
  coveredGridOffsets,
  regionDisplayOutline,
  unionGridSpaces,
  outlineChoice,
  usesCoverageHighlight,
} from "../../src/hooks/canvas/regionDisplayOutline";
import { setMockSettings } from "../_setup/foundryMocks";

/** The PIXI.Rectangle members the coverage test uses. */
class Rect {
  constructor(public x: number, public y: number, public width: number, public height: number) {}
  fit(other: Rect) {
    const x = Math.max(this.x, other.x);
    const y = Math.max(this.y, other.y);
    this.width = Math.min(this.x + this.width, other.x + other.width) - x;
    this.height = Math.min(this.y + this.height, other.y + other.height) - y;
    this.x = x;
    this.y = y;
    return this;
  }
  pad(amount: number) {
    this.x -= amount;
    this.y -= amount;
    this.width += amount * 2;
    this.height += amount * 2;
    return this;
  }
}

/** A 100 px square grid. */
const grid = {
  isGridless: false,
  isSquare: true,
  sizeX: 100,
  sizeY: 100,
  getOffsetRange: (b: Rect) => [
    Math.floor(b.y / 100),
    Math.floor(b.x / 100),
    Math.ceil((b.y + b.height) / 100),
    Math.ceil((b.x + b.width) / 100),
  ],
  getCenterPoint: ({ i, j }: { i: number; j: number }) => ({ x: j * 100 + 50, y: i * 100 + 50 }),
  getVertices: ({ i, j }: { i: number; j: number }) => [
    { x: j * 100, y: i * 100 },
    { x: j * 100 + 100, y: i * 100 },
    { x: j * 100 + 100, y: i * 100 + 100 },
    { x: j * 100, y: i * 100 + 100 },
  ],
};

/** A thin diagonal band from the top-left to the bottom-right of a 300 px square. */
function diagonalTree() {
  return {
    drawShape: vi.fn(),
    clipperPaths: [],
    testPoint: vi.fn(({ x, y }: { x: number; y: number }, distance = 0) =>
      Math.min(x, y) >= -distance && Math.max(x, y) <= 300 + distance && Math.abs(x - y) <= 20 + distance,
    ),
  };
}

function region(highlightMode: string | undefined, tree = diagonalTree(), displayOutline?: string) {
  return {
    document: { highlightMode, flags: displayOutline === undefined ? {} : { ddbimporter: { displayOutline } } },
    animationState: { polygonTree: tree, bounds: { x: 0, y: 0, width: 300, height: 300 } },
  } as unknown as TCoreRegionPlaceable;
}

let execute: ReturnType<typeof vi.fn>;
let added: unknown[];

beforeEach(() => {
  added = [];
  execute = vi.fn();
  vi.stubGlobal("PIXI", { Rectangle: Rect });
  vi.stubGlobal("ClipperLib", {
    IntPoint: class {
      constructor(public X: number, public Y: number) {}
    },
    Clipper: class {
      AddPaths(paths: unknown) {
        added.push(paths);
      }
      Execute = execute;
    },
    PolyTree: class {},
    PolyType: { ptSubject: 0 },
    ClipType: { ctUnion: 1 },
    PolyFillType: { pftNonZero: 1 },
  });
  (CONST as any).CLIPPER_SCALING_FACTOR = 100;
  (foundry as any).data.PolygonTree = { fromClipperPolyTree: vi.fn(() => ({ drawShape: vi.fn(), union: true })) };
  vi.stubGlobal("canvas", { grid, dimensions: { rect: new Rect(0, 0, 1000, 1000) } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (CONST as any).CLIPPER_SCALING_FACTOR;
  delete (foundry as any).data.PolygonTree;
});

describe("coverage outline", () => {
  it("finds the grid spaces whose centre the shape covers, as core's coverage highlight does", () => {
    const offsets = coveredGridOffsets(region("coverage"), grid as any, new Rect(0, 0, 1000, 1000) as any);
    expect(offsets).toEqual([
      { i: 0, j: 0 },
      { i: 1, j: 1 },
      { i: 2, j: 2 },
    ]);
  });

  it("does not grow the region's own bounds the way core's method does", () => {
    const placeable = region("coverage");
    coveredGridOffsets(placeable, grid as any, new Rect(0, 0, 1000, 1000) as any);
    expect(placeable.animationState.bounds).toEqual({ x: 0, y: 0, width: 300, height: 300 });
  });

  it("unions the covered spaces in Clipper units", () => {
    const tree = unionGridSpaces(grid, [{ i: 0, j: 0 }, { i: 0, j: 1 }]);
    expect(tree).toMatchObject({ union: true });
    const paths = added[0] as { X: number; Y: number }[][];
    expect(paths).toHaveLength(2);
    expect(paths[1][1]).toMatchObject({ X: 20000, Y: 0 });
    expect(execute).toHaveBeenCalledWith(1, expect.anything(), 1, 1);
    expect(unionGridSpaces(grid, [])).toBeNull();
  });

  it("traces the covered spaces only for a coverage region on a gridded scene", () => {
    const shapes = region("shapes");
    expect(usesCoverageHighlight(shapes)).toBe(false);
    expect(regionDisplayOutline(shapes)).toBe(shapes.animationState.polygonTree);

    const coverage = region("coverage");
    expect(usesCoverageHighlight(coverage)).toBe(true);
    const outline = regionDisplayOutline(coverage);
    expect(outline).toMatchObject({ union: true });
    // cached against the polygon tree, which core replaces whenever the shape changes
    expect(regionDisplayOutline(coverage)).toBe(outline);
    expect((foundry as any).data.PolygonTree.fromClipperPolyTree).toHaveBeenCalledTimes(1);

    (canvas as any).grid = { ...grid, isGridless: true };
    const gridless = region("coverage");
    expect(regionDisplayOutline(gridless)).toBe(gridless.animationState.polygonTree);
  });

  it("traces the true shape when the world setting or the region's own choice asks for it", () => {
    // an unregistered setting follows core
    expect(outlineChoice(region("coverage"))).toBe("coverage");

    setMockSettings({ "region-display-outline": "shape" });
    const world = region("coverage");
    expect(outlineChoice(world)).toBe("shape");
    expect(regionDisplayOutline(world)).toBe(world.animationState.polygonTree);
    // the region's choice wins over the setting; an empty choice follows it
    expect(outlineChoice(region("coverage", diagonalTree(), ""))).toBe("shape");
    const own = region("coverage", diagonalTree(), "coverage");
    expect(outlineChoice(own)).toBe("coverage");
    expect(regionDisplayOutline(own)).toMatchObject({ union: true });

    setMockSettings({ "region-display-outline": "coverage" });
    const shaped = region("coverage", diagonalTree(), "shape");
    expect(regionDisplayOutline(shaped)).toBe(shaped.animationState.polygonTree);
  });

  it("falls back to the true shape when the region covers no grid space, as core does", () => {
    const tree = { drawShape: vi.fn(), clipperPaths: [], testPoint: () => false };
    const empty = region("coverage", tree as any);
    expect(regionDisplayOutline(empty)).toBe(tree);
  });
});
