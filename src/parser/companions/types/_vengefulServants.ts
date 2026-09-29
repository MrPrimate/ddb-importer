// Leaf module (no imports): the enricher reads it without pulling DDBMonsterFactory into the enricher tree.

// the servants the Wretched Bloodline's Blood Ties choices allow (Fey, Fiend, Undead)
export const VENGEFUL_SERVANTS = [
  { name: "Lamia", ddbId2014: 16941, ddbId2024: 5195103 },
  { name: "Troll", ddbId2014: 17040, ddbId2024: 5195241 },
  { name: "Barbed Devil", ddbId2014: 16800, ddbId2024: 5194917 },
  { name: "Incubus", ddbId2014: 257235, ddbId2024: 4904793 },
  { name: "Succubus", ddbId2014: 17027, ddbId2024: 4904865 },
  { name: "Ghost", ddbId2014: 16871, ddbId2024: 5195008 },
  { name: "Wraith", ddbId2014: 17064, ddbId2024: 5174960 },
];

/** The summons key of one servant in a ruleset, shared with the enricher's profileKeys. */
export function vengefulServantKey(name: string, rules: "2014" | "2024"): string {
  return `VengefulServant${name.replace(/\s+/g, "")}${rules}`;
}
