// Leaf module (no imports): the enricher reads it without pulling DDBMonsterFactory into the enricher tree.

// the Heroes of Faerun Mechanical Wonders that wake as a creature once wound, with their D&D Beyond
// stat block and how long one winding keeps them running (their Wind-Up Operation trait)
export const WONDERS = [
  { name: "Domestic Wonder", ddbId: 5900642, duration: { value: "10", units: "day" } },
  { name: "Flying Wonder", ddbId: 5900662, duration: { value: "24", units: "hour" } },
] as const;

/** The wonder an item calls, by the item's name. */
export function findWonder(name: string | undefined): typeof WONDERS[number] | undefined {
  return WONDERS.find((wonder) => wonder.name === name);
}

/** The summons key of one wonder, shared with the enricher's profileKeys. */
export function wonderKey(name: string): string {
  return `MechanicalWonder${name.replace(/\s+/g, "")}2024`;
}
