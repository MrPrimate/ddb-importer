import { existingSpeciesKey, isSpeciesKey, speciesKey } from "../../src/lib/SpeciesIdentity";

const species = (entityRaceId: number, entityRaceTypeId: number, fullName: string, baseRaceId = entityRaceId) => ({
  entityRaceId, entityRaceTypeId, fullName, baseRaceId,
}) as IDDBMuleSpeciesDefinition;

describe("species identity", () => {
  const catalog = [species(4, 1743923279, "Aarakocra"), species(4, 1228963568, "Mountain Dwarf", 13), species(99, 1743923279, "Unique")];

  it("distinguishes species from subraces sharing a numeric ID", () => {
    expect(catalog.map(speciesKey)).toEqual(["1743923279:4", "1228963568:4", "1743923279:99"]);
  });

  it.each([undefined, null, 4, "4", "0:4", "1:0", "01:4", "1:4x", "1:9007199254740992", "1:4:5"])("rejects malformed key %s", (key) => {
    expect(isSpeciesKey(key)).toBe(false);
  });

  it.each(["High Elf", "Wood Elf"])("recovers a unique 2024 species despite its %s lineage label", (fullRaceName) => {
    const elf = species(1808057, 1743923279, "Elf");
    expect(existingSpeciesKey({ entityRaceId: elf.entityRaceId, fullRaceName, baseRaceId: 3 }, [elf]))
      .toBe("1743923279:1808057");
    expect(existingSpeciesKey({ entityRaceId: 999, fullRaceName }, [elf])).toBeNull();
  });

  it("requires unambiguous metadata to recover old compendium entries", () => {
    expect(existingSpeciesKey({ entityRaceId: 4 }, catalog)).toBeNull();
    expect(existingSpeciesKey({ entityRaceId: 4, baseRaceId: 13 }, catalog)).toBe("1228963568:4");
    expect(existingSpeciesKey({ entityRaceId: 4, baseRaceId: 13, fullRaceName: "Mountain Dwarf (PHB)" }, catalog)).toBe("1228963568:4");
    expect(existingSpeciesKey({ entityRaceId: 4, fullRaceName: "Aarakocra" }, catalog)).toBe("1743923279:4");
    expect(existingSpeciesKey({ entityRaceId: 4, fullRaceName: "Unknown" }, catalog)).toBeNull();
    expect(existingSpeciesKey({ entityRaceId: 4, entityRaceTypeId: 1743923279 }, [])).toBe("1743923279:4");
    expect(existingSpeciesKey({ entityRaceId: 4, entityRaceTypeId: 0 }, catalog)).toBeNull();
  });
});
