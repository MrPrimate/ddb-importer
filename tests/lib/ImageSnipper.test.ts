import ImageSnipper from "../../src/lib/ImageSnipper";

const SNIP: IDDBImageSnip = {
  url: "https://media.dndbeyond.com/compendium-images/test/art.png",
  sourceWidth: 1000,
  sourceHeight: 600,
  rotation: 30,
  centerX: 420,
  centerY: 310,
  width: 300,
  height: 200,
  shape: "rectangle",
};

describe("ImageSnipper.rotatedBounds", () => {
  it("keeps the size at 0 and 180 degrees, and swaps it at 90", () => {
    expect(ImageSnipper.rotatedBounds(1000, 600, 0)).toEqual({ width: 1000, height: 600 });
    const half = ImageSnipper.rotatedBounds(1000, 600, 180);
    expect(half.width).toBeCloseTo(1000);
    expect(half.height).toBeCloseTo(600);
    const quarter = ImageSnipper.rotatedBounds(1000, 600, 90);
    expect(quarter.width).toBeCloseTo(600);
    expect(quarter.height).toBeCloseTo(1000);
  });

  it("grows to hold the corners at 45 degrees", () => {
    const bounds = ImageSnipper.rotatedBounds(100, 100, 45);
    expect(bounds.width).toBeCloseTo(Math.SQRT2 * 100);
    expect(bounds.height).toBeCloseTo(Math.SQRT2 * 100);
  });
});

describe("ImageSnipper source and view mapping", () => {
  const source = { width: 1000, height: 600 };

  it("round trips points at several rotations", () => {
    for (const rotation of [0, 12.5, 45, 90, -37, 180, 271]) {
      for (const point of [{ x: 0, y: 0 }, { x: 420, y: 310 }, { x: 1000, y: 600 }, { x: 999, y: 1 }]) {
        const back = ImageSnipper.viewToSource(ImageSnipper.sourceToView(point, source, rotation), source, rotation);
        expect(back.x).toBeCloseTo(point.x);
        expect(back.y).toBeCloseTo(point.y);
      }
    }
  });

  it("maps the image centre to the view centre", () => {
    const view = ImageSnipper.sourceToView({ x: 500, y: 300 }, source, 33);
    const bounds = ImageSnipper.rotatedBounds(1000, 600, 33);
    expect(view.x).toBeCloseTo(bounds.width / 2);
    expect(view.y).toBeCloseTo(bounds.height / 2);
  });

  it("rotates clockwise in screen space", () => {
    // the top left corner of an unrotated 1000x600 image moves to the top right at 90 degrees
    const view = ImageSnipper.sourceToView({ x: 0, y: 0 }, source, 90);
    expect(view.x).toBeCloseTo(600);
    expect(view.y).toBeCloseTo(0);
  });
});

describe("ImageSnipper.normaliseSnip", () => {
  it("leaves a rectangle alone", () => {
    expect(ImageSnipper.normaliseSnip(SNIP)).toEqual(SNIP);
  });

  it("squares an uneven square or circle on its shorter side", () => {
    for (const shape of ["square", "circle"] as const) {
      const snip = ImageSnipper.normaliseSnip({ ...SNIP, shape });
      expect(snip.width).toBe(200);
      expect(snip.height).toBe(200);
      expect(snip.centerX).toBe(SNIP.centerX);
    }
  });

  it("reads an unknown shape as a rectangle", () => {
    expect(ImageSnipper.normaliseSnip({ ...SNIP, shape: "hexagon" as TDDBImageSnipShape }).shape).toBe("rectangle");
  });
});

describe("ImageSnipper.scaledSnip", () => {
  it("is unchanged when the served image matches the authored size", () => {
    expect(ImageSnipper.scaledSnip(SNIP, 1000, 600)).toEqual(SNIP);
  });

  it("scales the cut with a differently sized copy of the image", () => {
    const scaled = ImageSnipper.scaledSnip(SNIP, 500, 300);
    expect(scaled).toMatchObject({
      sourceWidth: 500,
      sourceHeight: 300,
      centerX: 210,
      centerY: 155,
      width: 150,
      height: 100,
      rotation: 30,
    });
  });
});

describe("ImageSnipper.outputSize", () => {
  it("keeps the source pixels without a maxSize", () => {
    expect(ImageSnipper.outputSize(SNIP)).toEqual({ width: 300, height: 200, scale: 1 });
  });

  it("scales down to fit maxSize but never up", () => {
    expect(ImageSnipper.outputSize({ ...SNIP, maxSize: 150 })).toEqual({ width: 150, height: 100, scale: 0.5 });
    expect(ImageSnipper.outputSize({ ...SNIP, maxSize: 1000 })).toEqual({ width: 300, height: 200, scale: 1 });
  });

  it("keeps a square square when scaled", () => {
    const size = ImageSnipper.outputSize({ ...SNIP, width: 333, height: 333, shape: "square", maxSize: 100 });
    expect(size.width).toBe(100);
    expect(size.height).toBe(100);
  });
});

describe("ImageSnipper.lookupKey and snipHash", () => {
  it("keys a plain download by its url", () => {
    expect(ImageSnipper.lookupKey(SNIP.url)).toBe(SNIP.url);
    expect(ImageSnipper.lookupKey(SNIP.url, null)).toBe(SNIP.url);
  });

  it("does not depend on the order of the snip's keys", () => {
    const reordered = Object.fromEntries(Object.entries(SNIP).reverse()) as unknown as IDDBImageSnip;
    expect(ImageSnipper.lookupKey(SNIP.url, reordered)).toBe(ImageSnipper.lookupKey(SNIP.url, SNIP));
    expect(ImageSnipper.snipHash(reordered)).toBe(ImageSnipper.snipHash(SNIP));
  });

  it("separates different cuts of one image", () => {
    const other = { ...SNIP, rotation: 31 };
    expect(ImageSnipper.lookupKey(SNIP.url, other)).not.toBe(ImageSnipper.lookupKey(SNIP.url, SNIP));
    expect(ImageSnipper.snipHash(other)).not.toBe(ImageSnipper.snipHash(SNIP));
    expect(ImageSnipper.snipHash(SNIP)).toMatch(/^[0-9a-z]+$/);
  });
});

describe("ImageSnipper entry text", () => {
  const token: IDDBImageSnip = { ...SNIP, shape: "square", width: 180, height: 180, maxSize: 400 };

  it("writes a pasteable property with a trailing comma", () => {
    const text = ImageSnipper.formatSnipEntry("Homunculus Servant", { actor: SNIP, token });
    expect(text.startsWith("  \"Homunculus Servant\": {")).toBe(true);
    expect(text.endsWith("},")).toBe(true);
    // valid as the body of an object literal
    const parsed = JSON.parse(`{${text.trim().replace(/,$/, "")}}`);
    expect(parsed["Homunculus Servant"].token.maxSize).toBe(400);
    expect(Object.keys(parsed["Homunculus Servant"].actor)[0]).toBe("url");
  });

  it("leaves out a missing target", () => {
    const text = ImageSnipper.formatSnipEntry("Only Token", { token });
    expect(text).not.toContain("\"actor\"");
  });

  it("round trips through parseSnipEntry", () => {
    const text = ImageSnipper.formatSnipEntry("Homunculus Servant", { actor: SNIP, token });
    expect(ImageSnipper.parseSnipEntry(text)).toEqual({ name: "Homunculus Servant", entry: { actor: SNIP, token } });
  });

  it("reads a bare entry object without a name", () => {
    const parsed = ImageSnipper.parseSnipEntry(JSON.stringify({ token }));
    expect(parsed).toEqual({ name: null, entry: { token } });
  });

  it("rejects text that is not an entry", () => {
    expect(ImageSnipper.parseSnipEntry("")).toBeNull();
    expect(ImageSnipper.parseSnipEntry("not json")).toBeNull();
    expect(ImageSnipper.parseSnipEntry("{\"actor\": {\"url\": 3}}")).toBeNull();
    expect(ImageSnipper.parseSnipEntry("\"A\": {}, \"B\": {}")).toBeNull();
  });
});
