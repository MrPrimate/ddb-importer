// @vitest-environment jsdom
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBRace from "../../../src/parser/race/DDBRace";

// An ancestry option grants the option of each dependent trait whose name carries its colour, gem,
// name or the damage type that gives (SPECIES_ANCESTRY_GRANTS).
describe("ancestry option keys", () => {
  const matching = (ancestry: string, candidates: string[]) => {
    const keys = DDBRace.ancestryOptionKeys(ancestry);
    return candidates.filter((name) => DDBRace.ancestryOptionMatches(keys, name));
  };

  it("reads the colour and its damage type from each dragonborn naming", () => {
    expect(DDBRace.ancestryOptionKeys("Draconic Ancestry: Black Dragon")).toEqual(["black", "acid"]);
    expect(DDBRace.ancestryOptionKeys("Chromatic Ancestry (White)")).toEqual(["white", "cold"]);
    expect(DDBRace.ancestryOptionKeys("Metallic Ancestry: Brass Metallic Ancestry")).toEqual(["brass", "fire"]);
    expect(DDBRace.ancestryOptionKeys("Gem Ancestry (Amethyst)")).toEqual(["amethyst", "force"]);
  });

  it("keeps a name that is not a dragon as the key", () => {
    expect(DDBRace.ancestryOptionKeys("Floral Legacy: Beauty")).toEqual(["beauty"]);
  });

  it("drops the repeated trait name from a label", () => {
    expect(DDBRace.ancestryOptionKeys("Gem Ancestry: Amethyst Gem Ancestry", "Gem Ancestry")).toEqual(["amethyst", "force"]);
    expect(DDBRace.ancestryOptionKeys("Floral Legacy: Beauty Floral Legacy")).toEqual(["beauty"]);
  });

  it("matches keys with regex characters literally", () => {
    expect(DDBRace.ancestryOptionMatches(["c++"], "Option (C++)")).toBe(true);
    expect(DDBRace.ancestryOptionMatches(["a.b"], "Option (axb)")).toBe(false);
  });

  it("matches exactly one option of the dependent trait", () => {
    const breath2024 = ["Breath Weapon (Acid)", "Breath Weapon (Cold)", "Breath Weapon (Fire)", "Breath Weapon (Lightning)", "Breath Weapon (Poison)"];
    expect(matching("Draconic Ancestry: Bronze Dragon", breath2024)).toEqual(["Breath Weapon (Lightning)"]);
    const breath2014 = ["Breath Weapon: Black Dragon", "Breath Weapon: Blue Dragon", "Breath Weapon: Bronze Dragon"];
    expect(matching("Draconic Ancestry: Blue Dragon", breath2014)).toEqual(["Breath Weapon: Blue Dragon"]);
    const fortitude = ["Floral Fortitude: Beauty Floral Fortitude", "Floral Fortitude: Healer Floral Fortitude"];
    expect(matching("Floral Legacy: Healer", fortitude)).toEqual(["Floral Fortitude: Healer Floral Fortitude"]);
    const limbs = ["Feral Limbs (Evil Alignment)", "Feral Limbs (Good Alignment)", "Feral Limbs (Neutral Alignment)"];
    expect(matching("Born of Madness: Good Alignment", limbs)).toEqual(["Feral Limbs (Good Alignment)"]);
  });
});
