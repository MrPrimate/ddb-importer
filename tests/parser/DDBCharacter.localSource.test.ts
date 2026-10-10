// getCharacterData answers from saved JSON when a payload is handed in or a source folder is
// configured, so lifecycle recaptures never fetch the character from DDB. A sync always goes
// to DDB, and a character missing from the folder fails rather than quietly fetching.

vi.mock("../../src/lib/FetchHelper", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  postJson: vi.fn(),
}));

import { postJson } from "../../src/lib/FetchHelper";
import DDBCharacter from "../../src/parser/DDBCharacter";
import DDBCharacterLocalSource from "../../src/lib/DDBCharacterLocalSource";
import { setMockSettings, resetMockSettings } from "../_setup/foundryMocks";

const post = vi.mocked(postJson);
const FOLDER = "modules/ddb-importer/tests/audit/fixtures/lifecycles";

function response(label = "Cthonic Pact") {
  return {
    success: true,
    ddb: {
      character: {
        id: 101,
        name: "Test Build",
        choices: { choiceDefinitions: [{ options: [{ label }] }] },
      },
    },
  };
}

describe("DDBCharacter.getCharacterData with a local source", () => {
  const filePicker = foundry.applications.apps.FilePicker as any;
  const originalImplementation = filePicker.implementation;

  beforeEach(() => {
    resetMockSettings();
    // an unset mock setting reads as a truthy string, which would send getCobalt to localStorage
    setMockSettings({ "cobalt-cookie-local": false, "cobalt-cookie": "", "beta-key": "", "campaign-id": "", "debug-json": false });
    post.mockReset();
    post.mockResolvedValue(response());
    DDBCharacterLocalSource.clearCache();
    filePicker.implementation = {
      browse: vi.fn(async () => ({ files: [`${FOLDER}/101-Test%20Build-import.json`], dirs: [] })),
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ format: 2, source: response() }) })));
  });

  afterEach(() => {
    filePicker.implementation = originalImplementation;
    vi.unstubAllGlobals();
  });

  it("parses a handed-in payload without calling the proxy, leaving the caller's copy untouched", async () => {
    const payload = { format: 2, source: response() };
    const ddbCharacter = new DDBCharacter({ characterId: "101" });
    ddbCharacter.localSource = payload;
    await ddbCharacter.getCharacterData();

    expect(post).not.toHaveBeenCalled();
    expect(ddbCharacter.sourceOrigin).toBe("local");
    expect(ddbCharacter.sourceFile).toBe("(provided)");
    expect(ddbCharacter.source?.ddb.character.choices.choiceDefinitions[0].options[0].label).toBe("Chthonic Pact");
    expect(ddbCharacter.sourceSnapshot).toEqual(ddbCharacter.source);
    expect(ddbCharacter.sourceSnapshot).not.toBe(ddbCharacter.source);
    expect(payload.source.ddb.character.choices.choiceDefinitions[0].options[0].label).toBe("Cthonic Pact");
  });

  it("reads the character's file from the configured folder", async () => {
    CONFIG.DDBI.DEV.characterSourcePath = FOLDER;
    const ddbCharacter = new DDBCharacter({ characterId: "101" });
    await ddbCharacter.getCharacterData();

    expect(post).not.toHaveBeenCalled();
    expect(ddbCharacter.source?.success).toBe(true);
    expect(ddbCharacter.sourceFile).toBe("101-Test Build-import.json");
  });

  it("fails a character missing from the folder instead of fetching it", async () => {
    CONFIG.DDBI.DEV.characterSourcePath = FOLDER;
    const ddbCharacter = new DDBCharacter({ characterId: "202" });
    await ddbCharacter.getCharacterData();

    expect(post).not.toHaveBeenCalled();
    expect(ddbCharacter.source?.success).toBe(false);
    expect(ddbCharacter.source?.message).toMatch(/No local source for character 202/);
  });

  it("fetches a missing character when the fallback is on", async () => {
    CONFIG.DDBI.DEV.characterSourcePath = FOLDER;
    CONFIG.DDBI.DEV.characterSourceFallback = true;
    const ddbCharacter = new DDBCharacter({ characterId: "202" });
    await ddbCharacter.getCharacterData();

    expect(post).toHaveBeenCalledTimes(1);
    expect(ddbCharacter.sourceOrigin).toBe("ddb");
  });

  it("always goes to DDB for a sync", async () => {
    const ddbCharacter = new DDBCharacter({ characterId: "101" });
    ddbCharacter.localSource = { format: 2, source: response() };
    await ddbCharacter.getCharacterData({ syncId: "sync-1" });

    expect(post).toHaveBeenCalledTimes(1);
    expect(ddbCharacter.sourceOrigin).toBe("ddb");
  });
});
