// Leaf module (no imports): the enricher reads it without pulling DDBMonsterFactory into the enricher tree.

// the titans the 2024 Scroll of Titan Summoning table names, as 2024 Monster Manual stat blocks
export const TITANS = [
  { name: "Animal Lord", ddbId: 5194892 },
  { name: "Blob of Annihilation", ddbId: 5194926 },
  { name: "Colossus", ddbId: 5194950 },
  { name: "Elemental Cataclysm", ddbId: 5194982 },
  // the Monster Manual prints a celestial and a fiendish empyrean
  { name: "Empyrean (Celestial)", ddbId: 5194984 },
  { name: "Empyrean (Fiend)", ddbId: 5194985 },
  { name: "Kraken", ddbId: 5195097 },
  { name: "Tarrasque", ddbId: 5195232 },
];

/** The summons key of one titan, shared with the enricher's profileKeys. */
export function titanKey(name: string): string {
  return `Titan${name.replace(/[\s()]+/g, "")}2024`;
}
