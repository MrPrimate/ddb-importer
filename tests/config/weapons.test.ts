import { DICTIONARY } from "../../src/config/_module";

// DDB tags renaissance/modern weapons with the property name
// "Ammunition (Firearms)" rather than a plain "Ammunition", so these mappings
// are what decides whether an imported Pistol ends up with dnd5e's `amm`
// property -- without it dnd5e never offers an ammunition selector.
describe("DICTIONARY.weapon.properties", () => {
  const findProperty = (name: string) => DICTIONARY.weapon.properties.find((p) => p.name === name);

  it("maps DDB 'Ammunition (Firearms)' to amm", () => {
    expect(findProperty("Ammunition (Firearms)")?.value).toBe("amm");
  });

  it("maps DDB 'Ammunition' to amm", () => {
    expect(findProperty("Ammunition")?.value).toBe("amm");
  });

  // `fir` is the Firearm property from The Gunslinger Class: Valda's Spire of
  // Secrets, a separate DDB property. Renaissance/modern weapons do not have it.
  it("maps only DDB 'Firearm' to fir", () => {
    expect(findProperty("Firearm")?.value).toBe("fir");
    expect(DICTIONARY.weapon.properties.filter((p) => p.value === "fir").map((p) => p.name)).toEqual(["Firearm"]);
  });

  it("maps DDB 'Burst Fire' to burstfire, gated on runtime injection", () => {
    const burstFire = findProperty("Burst Fire");
    expect(burstFire?.value).toBe("burstfire");
    expect(burstFire?.injected).toBe(true);
  });
});

describe("DICTIONARY.actor.proficiencies weapon ammunition", () => {
  const findWeapon = (name: string) =>
    DICTIONARY.actor.proficiencies.find((p) => p.type === "Weapon" && p.name === name);

  it.each([
    ["Pistol", "firearmBullet"],
    ["Pistol, Automatic", "firearmBullet"],
    ["Musket", "firearmBullet"],
    ["Revolver", "firearmBullet"],
    ["Shotgun", "firearmBullet"],
    ["Rifle, Hunting", "firearmBullet"],
    ["Rifle, Automatic", "firearmBullet"],
    ["Laser Pistol", "energyCell"],
    ["Laser Rifle", "energyCell"],
    ["Antimatter Rifle", "energyCell"],
  ])("gives %s an ammunition type of %s", (name, ammunitionType) => {
    expect(findWeapon(name)?.ammunitionType).toBe(ammunitionType);
  });

  it("declares the ammunition property on every firearm", () => {
    for (const name of ["Pistol", "Musket", "Laser Pistol", "Antimatter Rifle"]) {
      expect(findWeapon(name)?.properties?.amm).toBe(true);
    }
  });

  // `burst` was not a real property key, so the AdvancementHelper lookup for
  // "martial weapons that have the Burst Fire property" could never match it.
  it("uses the burstfire property key on Rifle, Automatic", () => {
    const properties = findWeapon("Rifle, Automatic")?.properties as Record<string, boolean> | undefined;
    expect(properties?.burstfire).toBe(true);
    expect(properties?.burst).toBeUndefined();
  });
});

// DDB ships energy cells as "Energy Cells, +2" / "Energy Cells, +3"; the parser
// matches the segment before the comma, then the first word.
describe("DICTIONARY.actor.proficiencies ammunition types", () => {
  const resolveAmmunition = (itemName: string) =>
    DICTIONARY.actor.proficiencies.find((prof) =>
      prof.type === "Ammunition"
      && (
        prof.name.toLowerCase() === itemName.toLowerCase().split(",")[0].trim()
        || prof.name.toLowerCase() === itemName.toLowerCase().split(" ")[0].trim()
      ),
    )?.ammunitionType;

  it.each([
    ["Energy Cells, +2", "energyCell"],
    ["Energy Cells, +3", "energyCell"],
    ["Energy Cell", "energyCell"],
    ["Bullets, Renaissance", "firearmBullet"],
    ["Bullets, Modern", "firearmBullet"],
    ["Arrows", "arrow"],
    ["Crossbow Bolts", "crossbowBolt"],
    ["Sling Bullets", "slingBullet"],
    ["Blowgun Needles", "blowgunNeedle"],
  ])("resolves %s to %s", (itemName, ammunitionType) => {
    expect(resolveAmmunition(itemName)).toBe(ammunitionType);
  });
});
