import { describe, it, expect } from "vitest";
import {
  decodeURIComponentSafe,
  ensureAssetsPrefix,
  IMAGE_EXT,
  isErrorDocument,
  remoteAssetCandidates,
  scanIds,
  ddbSlugify,
} from "../../../src/muncher/adventure/native/NativeShared";

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

describe("remoteAssetCandidates", () => {
  const CDN = "https://media.dndbeyond.com/compendium-images/tst/AbCdEfGhIjKlMnOp/";
  const MOBILE = "https://images.dndbeyond.com/mobile/compendium_images/tst/";
  const manifest = [
    `${CDN}map-03.05-the-grandfather-tree.jpg`,
    `${CDN}map-01.01-town.jpg`,
    `${CDN}map-01.02-caves.jpg`,
    `${MOBILE}map-02.01-shrine.png`,
    "https://images.dndbeyond.com/avatars/15/274/goblin.png",
  ];

  it("looks next to the DM version of a player map files.txt does not list", () => {
    expect(remoteAssetCandidates("assets/map-02.01-shrine-player.png", manifest, "tst")[0])
      .toBe(`${MOBILE}map-02.01-shrine-player.png`);
  });

  it("falls back to the book's most used compendium image folder", () => {
    expect(remoteAssetCandidates("assets/map-09.01-unlisted-player.jpg", manifest, "tst"))
      .toEqual([`${CDN}map-09.01-unlisted-player.jpg`, `${MOBILE}map-09.01-unlisted-player.jpg`]);
  });

  it("encodes the file name and ignores folders outside the book", () => {
    const urls = remoteAssetCandidates("assets/map-4.01-sewers -map.png", manifest, "tst");
    expect(urls[0]).toBe(`${CDN}map-4.01-sewers%20-map.png`);
    expect(urls.some((u) => u.includes("/avatars/"))).toBe(false);
  });

  it("caps the number of candidates", () => {
    expect(remoteAssetCandidates("assets/map-09.01-unlisted.jpg", manifest, "tst", 1)).toHaveLength(1);
  });

  it("has nothing to offer without a manifest", () => {
    expect(remoteAssetCandidates("assets/map.jpg", [], "tst")).toEqual([]);
  });
});

describe("decodeURIComponentSafe", () => {
  it("decodes escapes and keeps a malformed one as it is", () => {
    expect(decodeURIComponentSafe("a%20b")).toBe("a b");
    expect(decodeURIComponentSafe("100%")).toBe("100%");
  });
});

describe("isErrorDocument", () => {
  const S3_DENIED = `<?xml version="1.0" encoding="UTF-8"?>\n<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>`;

  it("spots an S3 error body served as an image", async () => {
    expect(await isErrorDocument(new Blob([S3_DENIED], { type: "image/jpeg" }))).toBe(true);
    expect(await isErrorDocument(new Blob([], { type: "image/png" }))).toBe(true);
  });

  it("passes images, including svg", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(await isErrorDocument(new Blob([png], { type: "image/png" }))).toBe(false);
    expect(await isErrorDocument(new Blob([`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>`], { type: "image/svg+xml" }))).toBe(false);
    expect(await isErrorDocument(new Blob([new Uint8Array(5000)], { type: "image/jpeg" }))).toBe(false);
  });
});
