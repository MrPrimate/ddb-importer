import { describe, it, expect } from "vitest";
import { ensureAssetsPrefix, IMAGE_EXT, scanIds, ddbSlugify } from "../../../src/muncher/adventure/native/NativeShared";

describe("ensureAssetsPrefix", () => {
  it("adds the assets/ prefix when absent", () => {
    expect(ensureAssetsPrefix("maps/forest.webp")).toBe("assets/maps/forest.webp");
  });
  it("strips a leading slash before prefixing", () => {
    expect(ensureAssetsPrefix("/maps/forest.webp")).toBe("assets/maps/forest.webp");
  });
  it("leaves an already-prefixed path untouched", () => {
    expect(ensureAssetsPrefix("assets/maps/forest.webp")).toBe("assets/maps/forest.webp");
  });
  it("collapses an already-localized path to its assets/ tail", () => {
    expect(
      ensureAssetsPrefix("ddb-images/adventures/Tomb_of_Annihilation/assets/map-04-013.wreck-of-the-star-goddess.jpg"),
    ).toBe("assets/map-04-013.wreck-of-the-star-goddess.jpg");
  });
  it("does not collapse on a substring match (segment-exact)", () => {
    expect(ensureAssetsPrefix("myassets/x.webp")).toBe("assets/myassets/x.webp");
  });
});

describe("IMAGE_EXT", () => {
  it("matches the supported image extensions (case-insensitive)", () => {
    for (const name of ["a.jpg", "a.jpeg", "a.PNG", "a.gif", "a.webp", "a.webm", "a.svg", "a.bmp", "a.tif", "a.tiff"]) {
      expect(IMAGE_EXT.test(name)).toBe(true);
    }
  });
  it("does not match non-image extensions", () => {
    for (const name of ["a.txt", "a.json", "a.db3", "a"]) {
      expect(IMAGE_EXT.test(name)).toBe(false);
    }
  });
});

describe("scanIds", () => {
  it("collects the first capture group across every row", () => {
    const rows = [
      { html: `<a href="ddb://monsters/17">Goblin</a> and <a href="ddb://monsters/42">Orc</a>` },
      { html: `<a href="ddb://monsters/17">Goblin again</a>` },
      { html: null },
      {},
    ];
    const ids = scanIds(rows, /ddb:\/\/monsters\/(\d+)/g);
    expect([...ids].sort()).toEqual(["17", "42"]);
  });
});

describe("ddbSlugify", () => {
  it("drops everything that is not a word/digit char, preserving case and order", () => {
    expect(ddbSlugify("Death at Sunset's Lair")).toBe("DeathatSunsetsLair");
    expect(ddbSlugify("01. Secret Den")).toBe("01SecretDen");
  });
});
