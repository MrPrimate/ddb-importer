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
