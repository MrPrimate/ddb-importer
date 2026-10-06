import CompendiumHelper from "../../src/lib/CompendiumHelper";

/**
 * retrieveCompendiumSpellReferences resolves spell names to compendium entries for one ruleset.
 * DDB keeps the wizard's name on spells that some books list without it (the 2024 Oath of Revelry
 * table has "Hideous Laughter" and "Telepathic Bond"), so an exact miss retries against the
 * possessive full name in the same ruleset.
 */
const INDEX = [
  { _id: "laughter14", name: "Hideous Laughter", system: { source: { rules: "2014" } }, flags: {} },
  { _id: "laughter24", name: "Tasha's Hideous Laughter", system: { source: { rules: "2024" } }, flags: {} },
  { _id: "bond24", name: "Rary’s Telepathic Bond", system: { source: { rules: "2024" } }, flags: {} },
  { _id: "charm24", name: "Charm Person", system: { source: { rules: "2024" } }, flags: {} },
  { _id: "hand24", name: "Bigby's Hand", system: { source: { rules: "2024" } }, flags: {} },
  { _id: "mage24", name: "Mage Hand", system: { source: { rules: "2024" } }, flags: {} },
];

async function lookupEntries(names: string[], use2024Spells: boolean) {
  const g = (globalThis as any).game;
  const pack = { indexFields: new Set(["name", "system.source"]), getIndex: async () => INDEX.map((e) => ({ ...e })) };
  const originalPacks = g.packs.get;
  const originalSettings = g.settings.get;
  g.packs.get = () => pack;
  g.settings.get = (_module: string, key: string) => (key === "entity-spell-compendium" ? "world.spells" : originalSettings(_module, key));
  try {
    return await CompendiumHelper.retrieveCompendiumSpellReferences(names, { use2024Spells });
  } finally {
    g.packs.get = originalPacks;
    g.settings.get = originalSettings;
  }
}

const lookup = async (names: string[], use2024Spells: boolean) =>
  (await lookupEntries(names, use2024Spells)).map((r) => r.name);

describe("CompendiumHelper.retrieveCompendiumSpellReferences", () => {
  it("resolves a short name to DDB's possessive spell name in the same ruleset", async () => {
    expect(await lookup(["Charm Person", "Hideous Laughter", "Telepathic Bond (1/day)"], true))
      .toEqual(["Charm Person", "Tasha's Hideous Laughter", "Rary’s Telepathic Bond (1/day)"]);
  });

  it("prefers an exact name and never crosses rulesets", async () => {
    expect(await lookup(["Hideous Laughter", "Telepathic Bond"], false)).toEqual(["Hideous Laughter"]);
  });

  // monster casts and Evolved item properties match results by the name they asked for
  it("records the requested name on an entry found under its possessive name", async () => {
    const entries = await lookupEntries(["Charm Person", "Hideous Laughter"], true);
    expect(entries.map((r) => [r.name, r.requestedName])).toEqual([
      ["Charm Person", undefined],
      ["Tasha's Hideous Laughter", "Hideous Laughter"],
    ]);
  });

  it("only takes a possessive whose whole remainder is the requested name", async () => {
    expect(await lookup(["Mage Hand", "Hand"], true)).toEqual(["Mage Hand", "Bigby's Hand"]);
    expect(await lookup(["Laughter"], true)).toEqual([]);
  });
});
