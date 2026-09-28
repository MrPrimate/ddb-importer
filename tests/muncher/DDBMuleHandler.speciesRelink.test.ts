import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";
import CharacterFeatureFactory from "../../src/parser/features/CharacterFeatureFactory";
import DDBRace from "../../src/parser/race/DDBRace";
import logger from "../../src/lib/Logger";
import CompendiumHelper from "../../src/lib/CompendiumHelper";
import { resetMockSettings, setMockSettings } from "../_setup/foundryMocks";

// Species are parsed while the mule stream arrives, before their traits are in the compendium, so
// the flush must write traits, rebuild each species against them, and only then write species.
describe("species compendium relink after the trait flush", () => {
  const key = "7|Tiefling (Infernal)|Tiefling|true|false|false";
  const firstPass = { name: "Tiefling (Infernal)", system: { advancement: {} } } as unknown as I5eRaceItem;
  const relinked = { name: "Tiefling (Infernal)", system: { advancement: { a: { type: "ItemGrant" } } } } as unknown as I5eRaceItem;
  const ddb = { character: { race: { fullName: "Tiefling" } } } as unknown as IDDBData;
  const calls: string[] = [];

  function handler() {
    const muleHandler = new DDBMuleHandler({ characterId: "123", type: "species", sources: [2] });
    muleHandler.pendingDocs.traits.set("trait", { name: "Fiendish Legacy: Infernal" });
    muleHandler.pendingDocs.species.set(key, firstPass);
    muleHandler._pendingSpeciesSources.set(key, ddb);
    return muleHandler;
  }

  beforeEach(() => {
    calls.length = 0;
    resetMockSettings();
    setMockSettings({
      "munching-policy-use-source-filter": false,
      "munching-policy-muncher-included-source-categories": [],
      "munching-policy-muncher-sources": [],
    });
    vi.spyOn(DDBMuleHandler.prototype, "notifier").mockImplementation(() => undefined);
    // older DDBCharacter constructors open the item and spell compendiums eagerly
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockReturnValue({} as ReturnType<typeof CompendiumHelper.getCompendiumType>);
    vi.spyOn(CharacterFeatureFactory, "writePendingCompendiumDocuments").mockImplementation(async () => {
      calls.push("traits");
    });
    vi.spyOn(DDBRace, "buildPendingSpeciesDocument").mockImplementation(async (ddbCharacter) => {
      calls.push("rebuild");
      expect(ddbCharacter.source?.ddb).toBe(ddb);
      expect(ddbCharacter.isMuncher).toBe(true);
      return relinked;
    });
    vi.spyOn(DDBRace, "writePendingSpeciesDocuments").mockImplementation(async () => {
      calls.push("species");
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    resetMockSettings();
  });

  it("rebuilds species after writing traits and writes the rebuilt document", async () => {
    await handler()._flushCompendiumDocuments();

    expect(calls).toEqual(["traits", "rebuild", "species"]);
    expect(DDBRace.writePendingSpeciesDocuments).toHaveBeenCalledWith([relinked], true);
  });

  it("keeps the streamed species when a rebuild fails", async () => {
    vi.mocked(DDBRace.buildPendingSpeciesDocument).mockRejectedValue(new Error("rebuild failed"));
    vi.spyOn(logger, "error").mockImplementation(() => undefined);

    await handler()._flushCompendiumDocuments();

    expect(DDBRace.writePendingSpeciesDocuments).toHaveBeenCalledWith([firstPass], true);
  });
});
