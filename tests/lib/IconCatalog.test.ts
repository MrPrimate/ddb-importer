import fs from "node:fs";
import {
  customCatalogIcons,
  customCatalogPaths,
  iconSearch,
  loadIconCatalog,
  mergeIconLists,
  withStatusIcons,
  withSystemIcons,
} from "../../src/lib/IconCatalog";
import { setMockSettings } from "../_setup/foundryMocks";
import { systemIcons } from "../../src/config/systemIcons";
import { allTags, createRanker } from "../../src/lib/IconCatalogSearch.mjs";

const icons: IIconCatalogEntry[] = [
  { id: "icons/svg/fire.svg", path: "icons/svg/fire.svg", name: "fire", hash: "x", tags: ["fire"], inferred: ["orange flame"], manual: ["warm"] },
  { id: "icons/magic/ice.webp", path: "icons/magic/ice.webp", name: "ice", hash: "y", tags: ["ice"], inferred: ["blue crystal"], manual: [] },
];

describe("shipped icon search", () => {
  it("counts reviewed visual hints only while the artwork hash matches", () => {
    const record = { ...icons[0], inferred: [] };
    expect(allTags(record, { [record.id]: { hash: record.hash, inferred: ["soft glow"] } })).toContain("glow");
    expect(allTags(record, { [record.id]: { hash: "changed", inferred: ["soft glow"] } })).not.toContain("glow");
  });
  it("includes system damage, conditions, extra statuses and localized aliases without duplicate paths", () => {
    const system = systemIcons({
      damageTypes: { fire: { label: "Fire", icon: icons[0].path }, empty: { label: "Missing" } },
      conditionTypes: { prone: { name: "ConProne", img: "systems/dnd5e/prone.svg" } },
      statusEffects: { sleeping: { name: "Sleeping", img: "systems/dnd5e/sleeping.svg" } },
      encumbrance: { effects: { encumbered: { name: "Encumbered", img: "systems/dnd5e/encumbered.svg" } } },
      bloodied: { name: "Bloodied", img: "systems/dnd5e/bloodied.svg" },
    });
    const entries = withSystemIcons(withStatusIcons(icons, {
      prone: { id: "prone", name: "Prone", img: "systems/dnd5e/prone.svg" },
    }, (name) => name), (name) => name === "ConProne" ? "A terre" : name, system);
    expect(entries).toHaveLength(6);
    expect(iconSearch(entries, "damage")("").map((icon) => icon.path)).toEqual([icons[0].path]);
    expect(iconSearch(entries, "dnd5eStatus")("")).toHaveLength(4);
    expect(iconSearch(entries, "status")("terre")[0].path).toBe("systems/dnd5e/prone.svg");
    expect(iconSearch(entries, "dnd5eStatus")("prone")[0].path).toBe("systems/dnd5e/prone.svg");
    expect(entries.find((icon) => icon.path === icons[0].path)).toMatchObject({ inferred: ["orange flame"], manual: ["warm"] });
    expect(icons[0]).not.toHaveProperty("damage");
  });

  it("uses the same synonyms and visual/manual tags as the workshop", () => {
    const search = iconSearch(icons, "all");
    expect(search("burning")[0].path).toBe(icons[0].path);
    expect(search("orange warm")[0].path).toBe(icons[0].path);
    expect(search("crystal")[0].path).toBe(icons[1].path);
    expect(search("cold")).toEqual(createRanker({ icons })({ name: "cold", tags: [], id: "" }, icons.length, "cold"));
  });

  it("merges status artwork by path and supports category filtering", () => {
    const entries = withStatusIcons(icons, [
      { id: "burning", img: icons[0].path, name: "Burning" },
      { id: "sleep", img: "systems/dnd5e/sleep.svg", name: "Sleeping" },
    ], (name) => name);
    expect(entries).toHaveLength(3);
    expect(iconSearch(entries, "status")("sleep")).toHaveLength(1);
    expect(iconSearch(entries, "svg")("")).toHaveLength(2);
    expect(iconSearch(entries, "all")("")).toHaveLength(3);
  });

  it("ships portable uniquely identified artwork and searchable visual tags", () => {
    const catalog = JSON.parse(fs.readFileSync(new URL("../../data/icon-catalog.json", import.meta.url), "utf8"));
    expect(catalog).not.toHaveProperty("iconDir");
    expect(catalog.icons).toHaveLength(7100);
    expect(new Set(catalog.icons.map((icon: IIconCatalogEntry) => icon.id)).size).toBe(7100);
    expect(catalog.icons.every((icon: IIconCatalogEntry) => icon.inferred.length > 0 && icon.id === icon.path && icon.path.startsWith("icons/"))).toBe(true);
    const acid = catalog.icons.find((icon: IIconCatalogEntry) => icon.path === "icons/svg/acid.svg");
    expect(allTags(acid)).toContain("bubble");
  });
});

it("finds common query words and prefixes in the real catalogue", () => {
  const catalog = JSON.parse(fs.readFileSync(new URL("../../data/icon-catalog.json", import.meta.url), "utf8"));
  const search = iconSearch(catalog.icons, "all");
  for (const word of ["weapon", "spell", "damage", "condition", "effect", "item", "creature"]) {
    expect(search(word).length, word).toBeGreaterThan(0);
  }
  expect(search("fir").some((icon) => icon.matched.includes("fire"))).toBe(true);
  expect(search("fire")[0].score).toBeGreaterThan(search("fir").find((icon) => icon.path === search("fire")[0].path)!.score);
  const fixture = [
    { ...icons[0], name: "blue fire", tags: ["blue", "fire"] },
    { ...icons[1], name: "blue firkin", tags: ["blue", "firkin"] },
  ];
  expect(iconSearch(fixture, "all")("blue fir")).toHaveLength(2);
  expect(iconSearch(fixture, "svg")("fir").map((icon) => icon.path)).toEqual([icons[0].path]);
});

it("ranks exact terms above rare completions without giving exact hits an extra prefix bonus", () => {
  const entry = (name: string, tags: string[] = []): IIconCatalogEntry => ({
    id: name, path: `icons/${name}.webp`, name, tags, inferred: [], manual: [], hash: "",
  });
  const fixture = [entry("sword"), entry("swordfish"), entry("swordfight"),
    ...Array.from({ length: 30 }, (_, i) => entry(`common-${i}`, ["sword"]))];
  const exact = iconSearch(fixture, "all")("sword");
  expect(exact.at(-1)!.score).toBeLessThan(exact.find((icon) => icon.id === "common-0")!.score);
  expect(exact.slice(-2).map((icon) => icon.id).sort()).toEqual(["swordfight", "swordfish"]);
  const withExtraCompletion = fixture.map((icon) => icon.id === "sword" ? { ...icon, tags: ["swordfight"] } : icon);
  expect(iconSearch(withExtraCompletion, "all")("sword")[0].score).toBe(exact[0].score);
  expect(iconSearch(fixture, "all")("sw").find((icon) => icon.id === "swordfish")).toBeDefined();
  expect(iconSearch(fixture, "all")("s").find((icon) => icon.id === "swordfish")).toBeDefined();
  expect(iconSearch(fixture, "all")("sw ")).toEqual([]);
});

it("prefers named categories and context over incidental rare visual tags in the real catalogue", () => {
  const catalog = JSON.parse(fs.readFileSync(new URL("../../data/icon-catalog.json", import.meta.url), "utf8"));
  const search = iconSearch(catalog.icons, "all");
  const swords = search("sword");
  expect(swords[0].path).toMatch(/^icons\/weapons\/swords\//);
  const fish = swords.find((icon) => icon.path.includes("fish-swordfish"))!;
  expect(fish.score).toBeLessThan(swords.find((icon) => icon.matched.includes("sword"))!.score);
  expect(search("fire sw")[0].path).not.toMatch(/potions/);
  expect(search("fire sw")[0].matched).toContain("fire");
  expect(search("fire sw").slice(0, 24).some((icon) => icon.path.startsWith("icons/weapons/swords/"))).toBe(true);
});

describe("custom icon lists", () => {
  it("reads bare arrays and the catalogue shape, deriving missing names and skipping bad entries", () => {
    expect(customCatalogIcons(["worlds/w/icons/frost-giant_axe.webp", "", 4, { name: "no path" }])).toEqual([
      { id: "worlds/w/icons/frost-giant_axe.webp", path: "worlds/w/icons/frost-giant_axe.webp", name: "frost giant axe", hash: "", tags: [], inferred: [], manual: [] },
    ]);
    const [entry] = customCatalogIcons({ version: 1, icons: [{ path: "a/b.png", name: "Moon Blade", tags: ["moon", 3], manual: ["silver"] }] });
    expect(entry).toMatchObject({ path: "a/b.png", name: "Moon Blade", tags: ["moon"], manual: ["silver"] });
    expect(() => customCatalogIcons({ icons: "nope" })).toThrow();
  });

  it("adds new paths and folds extra names and tags into shipped ones", () => {
    const result = mergeIconLists(icons, [
      customCatalogIcons([{ path: icons[0].path, name: "Dragon Breath", manual: ["dragon"] }, "worlds/w/moon.webp"]),
    ]);
    expect(result).toHaveLength(3);
    const fire = result.find((icon) => icon.path === icons[0].path)!;
    expect(fire.name).toBe("fire");
    expect(fire.tags).toEqual(expect.arrayContaining(["fire", "dragon", "breath"]));
    expect(fire.manual).toEqual(["warm", "dragon"]);
    expect(iconSearch(result, "all")("dragon")[0].path).toBe(icons[0].path);
    expect(iconSearch(result, "all")("moon")[0].path).toBe("worlds/w/moon.webp");
  });

  it("ignores non-string and duplicate setting values", () => {
    expect(customCatalogPaths([" a.json ", "a.json", 3, ""])).toEqual(["a.json"]);
    expect(customCatalogPaths(null)).toEqual([]);
  });

  it("merges the lists from the setting, skips a broken one and reloads when the setting changes", async () => {
    const files: Record<string, unknown> = {
      "modules/ddb-importer/dist/icon-catalog.json": { version: 1, icons: [{ path: "icons/svg/fire.svg", name: "fire", tags: ["fire"], inferred: [], manual: [] }] },
      "worlds/w/one.json": ["worlds/w/one.webp"],
      "worlds/w/two.json": [{ path: "worlds/w/two.webp", name: "Two" }],
    };
    const fetchMock = vi.fn(async (path: string) => files[path]
      ? { ok: true, status: 200, json: async () => files[path] }
      : { ok: false, status: 404, json: async () => null });
    vi.stubGlobal("fetch", fetchMock);
    try {
      setMockSettings({ "icon-catalog-custom-paths": ["worlds/w/one.json", "worlds/w/missing.json"] });
      const first = await loadIconCatalog();
      expect(first.map((icon) => icon.path)).toEqual(["icons/svg/fire.svg", "worlds/w/one.webp"]);
      expect(await loadIconCatalog()).toBe(first);
      setMockSettings({ "icon-catalog-custom-paths": ["worlds/w/two.json"] });
      expect((await loadIconCatalog()).map((icon) => icon.name)).toEqual(["fire", "Two"]);
    } finally {
      vi.unstubAllGlobals();
      setMockSettings({ "icon-catalog-custom-paths": [] });
    }
  });
});
