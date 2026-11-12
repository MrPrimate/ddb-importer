import { ddbWeaponKey, parseWeaponMastery, weaponMaterialVariant } from "../../../src/parser/lib/WeaponMastery";

describe("weaponMaterialVariant", () => {
  it.each([
    ["Longsword, Silver", "Longsword", "longsword", "mar:longsword", true],
    ["Dagger, Silver", "Dagger", "dagger", "sim:dagger", true],
    ["Dart, Wooden", "Dart", "dart", "sim:dart", false],
    ["War Pick, Silver", "War Pick", "warpick", "mar:warpick", true],
    ["Shortbow (Wooden Arrows)", "Shortbow", "shortbow", "sim:shortbow", false],
  ])("resolves %s to the core %s", (name, base, key, advancement, silvered) => {
    expect(weaponMaterialVariant(name)).toEqual({ base, key, advancement, silvered });
  });

  it.each(["Longsword", "Crossbow, Hand", "Pistol, Automatic", "Moonblade, Silver", "", null, undefined])(
    "leaves %s alone",
    (name) => {
      expect(weaponMaterialVariant(name)).toBeNull();
    },
  );
});

describe("ddbWeaponKey", () => {
  it("reverses the comma qualifier and squashes spaces", () => {
    expect(ddbWeaponKey("Crossbow, Hand")).toBe("handcrossbow");
    expect(ddbWeaponKey("Pistol, Automatic")).toBe("automaticpistol");
  });
});

describe("parseWeaponMastery material copies", () => {
  it("resolves a wooden-bolts crossbow named in either word order", () => {
    expect(weaponMaterialVariant("Light Crossbow (Wooden Bolts)")?.key)
      .toBe(weaponMaterialVariant("Crossbow, Light (Wooden Bolts)")?.key);
    expect(weaponMaterialVariant("Light Crossbow (Wooden Bolts)")?.key).toBe("lightcrossbow");
  });

  it("returns the core weapon key and advancement", () => {
    expect(parseWeaponMastery("Vex (Shortsword, Silver)")).toEqual({
      weapon: "Shortsword, Silver",
      mastery: "Vex",
      dnd5eName: "shortsword",
      advancement: "mar:shortsword",
    });
  });
});

describe("parseWeaponMastery word order", () => {
  // DDB names the November 2026 Drops weapons' masteries weapon first: "Bola (Topple)"
  const g = globalThis as unknown as { CONFIG: { DDB?: { weapons?: unknown[] } } };
  let saved: unknown;
  beforeAll(() => {
    g.CONFIG ??= {} as never;
    saved = g.CONFIG.DDB;
    g.CONFIG.DDB = { ...(g.CONFIG.DDB ?? {}), weapons: [
      { id: 232, name: "Bola", categoryId: 2 },
      { id: 234, name: "Pitchfork", categoryId: 1 },
      { id: 233, name: "Weighted Chain", categoryId: 2 },
    ] };
  });
  afterAll(() => {
    g.CONFIG.DDB = saved as never;
  });

  it.each([
    ["Bola (Topple)", "Bola", "Topple", "bola", "mar:bola"],
    ["Pitchfork (Push)", "Pitchfork", "Push", "pitchfork", "sim:pitchfork"],
    ["Weighted Chain (Graze)", "Weighted Chain", "Graze", "weightedchain", "mar:weightedchain"],
  ])("reads the weapon-first %s", (label, weapon, mastery, dnd5eName, advancement) => {
    expect(parseWeaponMastery(label)).toEqual({ weapon, mastery, dnd5eName, advancement });
  });

  it("still reads the mastery-first core form, and the core weapon written weapon first", () => {
    expect(parseWeaponMastery("Topple (Battleaxe)")).toEqual({
      weapon: "Battleaxe", mastery: "Topple", dnd5eName: "battleaxe", advancement: "mar:battleaxe",
    });
    expect(parseWeaponMastery("Battleaxe (Topple)")?.dnd5eName).toBe("battleaxe");
  });
});
