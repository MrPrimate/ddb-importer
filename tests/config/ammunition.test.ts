import { DICTIONARY } from "../../src/config/_module";

// Mage Hand Press ammunition types, injected into
// CONFIG.DND5E.consumableTypes.ammo.subtypes when the items are in the compendium.
describe("DICTIONARY.ammunition.mageHandPress", () => {
  const find = (key: string) => DICTIONARY.ammunition.mageHandPress.find((a) => a.key === key);

  it("defines exactly the four new types", () => {
    expect(DICTIONARY.ammunition.mageHandPress.map((a) => a.key).sort())
      .toEqual(["cannonballs", "flares", "shells", "shot"]);
  });

  it.each([
    ["shells", "Shells"],
    ["shot", "Shot"],
    ["cannonballs", "Cannonballs"],
    ["flares", "Flares"],
  ])("labels %s as %s", (key, label) => {
    expect(find(key)?.label).toBe(label);
  });

  // DDB never states which ammunition a weapon takes, so this table is from the
  // source book. The nine guns not listed keep firearmBullet.
  it.each([
    ["shells", ["Double-Barrel Shotgun", "Pump Shotgun"]],
    ["shot", ["Blunderbuss"]],
    ["flares", ["Flare Gun"]],
  ])("maps %s to the right weapons", (key, weaponTypes) => {
    expect(find(key)?.weaponTypes).toEqual(weaponTypes);
  });

  // the Cannon is claimed by src/parser/enrichers/item/Cannon.ts instead, since
  // other publishers use that weapon name too
  it("leaves the Cannon to its enricher", () => {
    expect(find("cannonballs")?.weaponTypes).toEqual([]);
  });

  it("does not claim any of the nine bullet firearms", () => {
    const claimed = DICTIONARY.ammunition.mageHandPress.flatMap((a) => a.weaponTypes);
    for (const weapon of [
      "Handgun", "Revolver (TGC)", "Magnum", "Parlor Gun", "Hunting Rifle",
      "Sniper Rifle", "Assault Rifle", "Gatling Gun", "Submachine Gun",
    ]) {
      expect(claimed).not.toContain(weapon);
    }
  });

  it("uses only lowercase keys with no spaces", () => {
    for (const ammo of DICTIONARY.ammunition.mageHandPress) {
      expect(ammo.key).toMatch(/^[a-z]+$/);
    }
  });
});

describe("SOURCE_CATEGORIES.mageHandPress", () => {
  it("is DDB source category 32", () => {
    expect(DICTIONARY.sourceCategories.mageHandPress).toBe(32);
  });
});
