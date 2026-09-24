import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildRuntimeCatalog, indexCatalog, readCatalog, runtimeCatalog } from "../../tools/icon-catalog.mjs";
import { createRanker } from "../../src/lib/IconCatalogSearch.mjs";

let directory: string;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "ddbi-icon-catalog-"));
});

afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

it("refreshes alternate catalogues deterministically, retaining manual tags and only valid visual tags", () => {
  const images = path.join(directory, "images");
  fs.mkdirSync(images);
  fs.writeFileSync(path.join(images, "z-fire.svg"), "first");
  fs.writeFileSync(path.join(images, "a-acid.svg"), "second");
  const catalog = path.join(directory, "catalog.json");
  const icons = indexCatalog(images, catalog);
  expect(icons.map((icon: IIconCatalogEntry) => icon.path)).toEqual(["icons/a-acid.svg", "icons/z-fire.svg"]);
  for (const icon of icons) {
    icon.inferred = ["visual"];
    icon.manual = ["curated"];
  }
  fs.writeFileSync(catalog, JSON.stringify({ version: 1, icons }));
  indexCatalog(images, catalog);
  const refreshed = fs.readFileSync(catalog, "utf8");
  indexCatalog(images, catalog);
  expect(fs.readFileSync(catalog, "utf8")).toBe(refreshed);
  expect(refreshed).not.toContain(directory);
  fs.writeFileSync(path.join(images, "z-fire.svg"), "changed artwork");
  expect(indexCatalog(images, catalog)).toMatchObject([
    { inferred: ["visual"], manual: ["curated"] },
    { inferred: [], manual: ["curated"] },
  ]);
  fs.unlinkSync(path.join(images, "a-acid.svg"));
  expect(indexCatalog(images, catalog).map((icon: IIconCatalogEntry) => icon.path)).toEqual(["icons/z-fire.svg"]);
  fs.unlinkSync(path.join(images, "z-fire.svg"));
  const previous = fs.readFileSync(catalog, "utf8");
  expect(() => indexCatalog(images, catalog)).toThrow("catalogue unchanged");
  expect(fs.readFileSync(catalog, "utf8")).toBe(previous);
  expect(fs.readdirSync(directory).some((file) => file.includes(".tmp-"))).toBe(false);
});

it("builds a compact browser copy with identical search without rewriting its source", () => {
  const canonical = readCatalog();
  const runtime = runtimeCatalog(canonical);
  expect(runtime.icons).toHaveLength(canonical.icons.length);
  expect(runtime.icons.every((icon: object) => !("hash" in icon) && !("id" in icon))).toBe(true);
  const rank = createRanker(canonical);
  const runtimeRank = createRanker(runtime);
  for (const query of ["damage", "fir", "acid bubble", "weapon", "skull"]) {
    expect(runtimeRank({ name: "", tags: [] }, 24, query)).toEqual(rank({ name: "", tags: [] }, 24, query));
  }
  const file = path.join(directory, "source.json");
  const output = path.join(directory, "dist/catalog.json");
  const source = JSON.stringify(canonical, null, 2);
  fs.writeFileSync(file, source);
  buildRuntimeCatalog(output, file);
  expect(fs.readFileSync(file, "utf8")).toBe(source);
  expect(JSON.parse(fs.readFileSync(output, "utf8"))).toEqual(runtime);
  expect(fs.statSync(output).size).toBeLessThan(Buffer.byteLength(source) / 2);
});
