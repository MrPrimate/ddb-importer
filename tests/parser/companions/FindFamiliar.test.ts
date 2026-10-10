// The familiar forms are monster compendium lookups; these tests pin the creature types and
// summon mode each caller gets, which do not depend on what the compendium holds.
vi.mock("../../../src/parser/DDBMonsterFactory", () => ({
  default: class {
    async processIntoCompendium() {
      // no compendium in unit tests
    }
  },
}));

import { getFindFamiliarActivityData } from "../../../src/parser/companions/types/FindFamiliar";
import { CompendiumHelper } from "../../../src/lib/_module";

function originDocument(originalName: string) {
  return { flags: { ddbimporter: { originalName, dndbeyond: {} } } };
}

describe("getFindFamiliarActivityData creature types", () => {
  const realGetCompendiumType = CompendiumHelper.getCompendiumType;

  beforeEach(() => {
    (CompendiumHelper as any).getCompendiumType = () => undefined;
  });

  afterEach(() => {
    (CompendiumHelper as any).getCompendiumType = realGetCompendiumType;
  });

  it("offers celestial, fey and fiend for the 2024 spell", async () => {
    const data = await getFindFamiliarActivityData(
      { name: "Find Familiar" } as any,
      { is2014: false, originDocument: originDocument("Find Familiar") },
    );
    expect(data.creatureTypes).toEqual(["celestial", "fey", "fiend"]);
    expect(data.summon.mode).toBe("cr");
  });

  it("adds undead for the Necromancy Spellbook's Undead Familiar cast", async () => {
    const data = await getFindFamiliarActivityData(
      { name: "Cast Find Familiar (Undead Familiar)" } as any,
      { is2014: false, originDocument: originDocument("Necromancy Spellbook") },
    );
    expect(data.creatureTypes).toEqual(["celestial", "fey", "fiend", "undead"]);
    expect(data.summon.mode).toBe("cr");
  });

  it("keeps the Skeleton and Zombie forms on their own type", async () => {
    const data = await getFindFamiliarActivityData(
      { name: "Cast Find Familiar (Skeleton or Zombie)" } as any,
      { is2014: false, originDocument: originDocument("Necromancy Spellbook") },
    );
    expect(data.creatureTypes).toEqual([]);
    expect(data.summon.mode).toBe("");
  });
});
