// Leaf module (no imports): the enricher reads it without pulling DDBMonsterFactory into the enricher tree.

// the servants the Wretched Bloodline's Blood Ties choices allow
export const VENGEFUL_SERVANTS = [
  { name: "Lamia", tie: "Fey", ddbId2014: 16941, ddbId2024: 5195103 },
  { name: "Troll", tie: "Fey", ddbId2014: 17040, ddbId2024: 5195241 },
  { name: "Barbed Devil", tie: "Fiend", ddbId2014: 16800, ddbId2024: 5194917 },
  { name: "Incubus", tie: "Fiend", ddbId2014: 257235, ddbId2024: 4904793 },
  { name: "Succubus", tie: "Fiend", ddbId2014: 17027, ddbId2024: 4904865 },
  { name: "Ghost", tie: "Undead", ddbId2014: 16871, ddbId2024: 5195008 },
  { name: "Wraith", tie: "Undead", ddbId2014: 17064, ddbId2024: 5174960 },
];

/** The summons key of one servant in a ruleset, shared with the enricher's profileKeys. */
export function vengefulServantKey(name: string, rules: "2014" | "2024"): string {
  return `VengefulServant${name.replace(/\s+/g, "")}${rules}`;
}

/**
 * The character's Blood Ties option (Fey, Fiend or Undead): the class option recorded against the
 * Blood Ties feature itself, so another feature's "Fey" option cannot match.
 */
export function chosenBloodTie(ddbData: IDDBData | null | undefined): string | null {
  if (!ddbData) return null;
  const feature = ddbData.character.classes
    .flatMap((klass) => klass.classFeatures)
    .find((f) => f.definition.name === "Blood Ties");
  if (!feature) return null;
  const ties = new Set(VENGEFUL_SERVANTS.map((servant) => servant.tie));
  const option = (ddbData.character.options?.class ?? []).find((o) =>
    o.componentId === feature.definition.id && ties.has(o.definition?.name ?? ""),
  );
  return option?.definition?.name ?? null;
}

/**
 * The servants on offer: every one for the muncher (or a character with no recorded choice), only
 * the chosen Blood Ties' creatures for a character import.
 */
export function vengefulServantsFor({ isMuncher, ddbData }: { isMuncher?: boolean; ddbData?: IDDBData | null }) {
  const tie = isMuncher ? null : chosenBloodTie(ddbData);
  return tie ? VENGEFUL_SERVANTS.filter((servant) => servant.tie === tie) : VENGEFUL_SERVANTS;
}
