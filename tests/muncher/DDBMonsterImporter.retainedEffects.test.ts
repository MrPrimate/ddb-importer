vi.mock("../../src/lib/_module", () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), verbose: vi.fn() },
  utils: { getSetting: () => undefined },
  Iconizer: {},
  DDBItemImporter: {},
  DDBEffectImporter: {},
  FileHelper: {},
  CompendiumHelper: {},
}));

import DDBMonsterImporter from "../../src/muncher/DDBMonsterImporter";

const generated = (name: string) => ({ _id: `gen${name}`, name, flags: { ddbimporter: { disabled: false } } }) as unknown as I5eEffectData;
const userMade = (name: string) => ({ _id: `usr${name}`, name, flags: {} }) as unknown as I5eEffectData;

describe("DDBMonsterImporter.withRetainedUserEffects", () => {
  it("drops an importer effect the new parse no longer builds", () => {
    expect(DDBMonsterImporter.withRetainedUserEffects([], [generated("Repulsion Breath: Prone")])).toEqual([]);
  });

  it("keeps an effect a user added, with or without new parsed effects", () => {
    expect(DDBMonsterImporter.withRetainedUserEffects([], [userMade("Homebrew")]).map((e) => e.name)).toEqual(["Homebrew"]);
    expect(DDBMonsterImporter.withRetainedUserEffects([generated("Status: Cursed")], [generated("Old"), userMade("Homebrew")]).map((e) => e.name))
      .toEqual(["Status: Cursed", "Homebrew"]);
  });

  it("does not duplicate an effect the new parse already carries by id", () => {
    const effect = userMade("Homebrew");
    expect(DDBMonsterImporter.withRetainedUserEffects([effect], [effect])).toHaveLength(1);
  });

  it("treats missing parsed effects as none", () => {
    expect(DDBMonsterImporter.withRetainedUserEffects(undefined, [userMade("Homebrew")])).toHaveLength(1);
  });
});
